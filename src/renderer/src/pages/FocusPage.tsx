import { useCallback, useEffect, useMemo, useState } from 'react'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/DataContext'
import { useFocusSession } from '../context/FocusSessionContext'
import { FOCUS_DURATION_MINUTES, FOCUS_START_GRACE_MS } from '../focusConstants'
import {
  isPlanetUnlocked,
  PLANET_OPTIONS,
  PLANET_PICKER_GROUP_LABELS,
  PLANET_PICKER_GROUP_ORDER,
  type PlanetPickerGroup
} from '../planetCatalog'

/**
 * Drives re-renders ~1 Hz while a timer is active. Also bumps when the window regains focus /
 * visibility so wall-clock math catches up after background throttling or navigation away.
 */
function useWallClockTick(active: boolean) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const bump = () => setTick((t) => t + 1)
    const id = window.setInterval(bump, 1000)
    document.addEventListener('visibilitychange', bump)
    window.addEventListener('focus', bump)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', bump)
      window.removeEventListener('focus', bump)
    }
  }, [active])
  return tick
}

function CarouselChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg className="planet-carousel__chevron" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {dir === 'left' ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 6l-6 6 6 6"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6l6 6-6 6"
        />
      )}
    </svg>
  )
}

type PlanetOption = (typeof PLANET_OPTIONS)[number]

const FOCUS_ORBIT_RING_R = 52

function FocusRunningOrbit({
  imageSrc,
  progress,
  overtime
}: {
  imageSrc: string
  progress: number
  overtime: boolean
}) {
  const c = 2 * Math.PI * FOCUS_ORBIT_RING_R
  const offset = c * (1 - progress)
  return (
    <div
      className={`focus-run-orbit${overtime ? ' focus-run-orbit--overtime' : ''}`}
      role="img"
      aria-label={overtime ? 'Focus session in overtime' : 'Focus session progress'}
    >
      <svg className="focus-run-orbit__svg" viewBox="0 0 120 120" aria-hidden>
        <circle
          className="focus-run-orbit__track"
          cx="60"
          cy="60"
          r={FOCUS_ORBIT_RING_R}
          fill="none"
          strokeWidth="5.5"
        />
        <circle
          className="focus-run-orbit__progress"
          cx="60"
          cy="60"
          r={FOCUS_ORBIT_RING_R}
          fill="none"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="focus-run-orbit__disc">
        <img src={imageSrc} alt="" className="focus-run-orbit__img" />
      </div>
    </div>
  )
}

function PlanetCarouselTile({
  planet,
  unlocked,
  size,
  onActivate
}: {
  planet: PlanetOption
  unlocked: boolean
  size: 'side' | 'center'
  onActivate: (id: string, unlocked: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`planet-carousel__tile ${size === 'center' ? 'planet-carousel__tile--center' : 'planet-carousel__tile--side'}${!unlocked ? ' planet-carousel__tile--locked' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onActivate(planet.id, unlocked)
      }}
    >
      <img
        src={planet.image}
        alt=""
        className={`planet-carousel__img ${size === 'center' ? 'planet-carousel__img--center' : 'planet-carousel__img--side'}${unlocked ? '' : ' locked'}`}
      />
      <span className="planet-carousel__label">{planet.label}</span>
      {!unlocked && <span className="planet-carousel__badge">Locked</span>}
    </button>
  )
}

export default function FocusPage() {
  const navigate = useNavigate()
  const { data, refresh } = useAppData()
  const {
    session,
    breakEndsAt,
    beginSession,
    clearSession,
    beginBreak,
    clearBreak,
    updateSessionTagId,
    focusSetup,
    updateFocusSetup
  } = useFocusSession()
  const planned = focusSetup.plannedMinutes
  const tagId = focusSetup.tagId
  const selectedPlanet = focusSetup.planetStyleId
  const [hardcore, setHardcore] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [planetPickerOpen, setPlanetPickerOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagKind, setNewTagKind] = useState('general')
  const [planetCenterIdx, setPlanetCenterIdx] = useState(0)
  const [pickerGroup, setPickerGroup] = useState<PlanetPickerGroup>('solar_system')

  useEffect(() => {
    if (!data || session) return
    setHardcore(data.settings.hardcoreDefault)
  }, [data, session])

  const resolvedTagId = useMemo(() => {
    if (!data) return ''
    if (tagId && data.tags.some((t) => t.id === tagId)) return tagId
    return data.defaultTagId
  }, [data, tagId])

  useEffect(() => {
    if (!session) return
    setHardcore(session.hardcore)
  }, [session])

  const running = session !== null
  const wallTick = useWallClockTick(running || breakEndsAt !== null)

  const elapsedSec = useMemo(() => {
    if (!session) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))
  }, [session, wallTick])

  const breakLeftSec = useMemo(() => {
    if (!breakEndsAt) return 0
    return Math.max(0, Math.ceil((breakEndsAt - Date.now()) / 1000))
  }, [breakEndsAt, wallTick])

  useEffect(() => {
    if (!breakEndsAt || Date.now() < breakEndsAt) return
    clearBreak()
  }, [breakEndsAt, wallTick, clearBreak])

  const carouselPlanets = useMemo(
    () => PLANET_OPTIONS.filter((p) => p.pickerGroup === pickerGroup),
    [pickerGroup]
  )

  useEffect(() => {
    if (!planetPickerOpen) return
    const opt = PLANET_OPTIONS.find((p) => p.id === selectedPlanet)
    const g = opt?.pickerGroup ?? 'solar_system'
    setPickerGroup(g)
    const list = PLANET_OPTIONS.filter((p) => p.pickerGroup === g)
    const i = list.findIndex((p) => p.id === selectedPlanet)
    setPlanetCenterIdx(i >= 0 ? i : 0)
  }, [planetPickerOpen, selectedPlanet])

  const start = useCallback(async () => {
    if (!data) return
    const t = resolvedTagId
    updateFocusSetup({ tagId: t })
    beginSession({
      startedAt: new Date().toISOString(),
      plannedMinutes: planned,
      tagId: t,
      hardcore,
      planetStyleId: selectedPlanet
    })
    await window.ae.setFocusActive(true)
  }, [data, resolvedTagId, planned, hardcore, selectedPlanet, beginSession, updateFocusSetup])

  const finishSession = useCallback(async () => {
    if (!data || !session) return
    const elapsedMs = Math.max(0, Date.now() - new Date(session.startedAt).getTime())
    if (elapsedMs < FOCUS_START_GRACE_MS) {
      clearSession()
      await window.ae.setFocusActive(false)
      return
    }
    const actualMinutes = elapsedMs / 60000
    if (session.hardcore && actualMinutes < session.plannedMinutes - 0.02) {
      const ok = window.confirm('Hardcore mode: end early and earn 0 for this run?')
      if (!ok) return
    }
    clearSession()
    await window.ae.setFocusActive(false)
    const res = await window.ae.endSession({
      plannedMinutes: session.plannedMinutes,
      actualMinutes,
      tagId: session.tagId,
      hardcore: session.hardcore,
      startedAt: session.startedAt,
      planetStyleId: session.planetStyleId
    })
    if (res.achievements?.length) {
      const a = res.achievements[0]
      setToast(`Milestone unlocked: ${a.title}`)
      window.setTimeout(() => setToast(null), 6000)
    }
    await refresh()
    beginBreak((5 + Math.floor(Math.random() * 6)) * 60)
  }, [data, session, clearSession, refresh, beginBreak])

  const createTag = useCallback(async () => {
    const name = newTagName.trim()
    if (!name) return
    const id = await window.ae.createTag(name, newTagKind)
    setNewTagName('')
    setTagModalOpen(false)
    await refresh()
    if (session) updateSessionTagId(id)
    else updateFocusSetup({ tagId: id })
  }, [newTagName, newTagKind, refresh, session, updateSessionTagId, updateFocusSetup])

  useEffect(() => {
    if (!breakEndsAt || Date.now() >= breakEndsAt) return
    const id = window.setInterval(() => {
      void window.ae.creditBreak(1).then(() => void refresh())
    }, 4000)
    return () => clearInterval(id)
  }, [breakEndsAt, refresh])

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const plannedSec = planned * 60
  const status = useMemo(() => {
    if (!running) return ''
    return elapsedSec < plannedSec ? 'Focusing' : 'Overtime bonus active'
  }, [running, elapsedSec, plannedSec])

  const sessionTimerDisplay = useMemo(() => {
    if (!running) return ''
    if (elapsedSec < plannedSec) return fmt(plannedSec - elapsedSec)
    return `+${fmt(elapsedSec - plannedSec)}`
  }, [running, elapsedSec, plannedSec])

  const plannedProgress = useMemo(() => {
    if (!session) return 0
    return Math.min(1, elapsedSec / Math.max(1, session.plannedMinutes * 60))
  }, [session, elapsedSec])

  const inStartGrace = running && elapsedSec < FOCUS_START_GRACE_MS / 1000
  const graceLeftSec = useMemo(() => {
    if (!session) return 0
    const ms = Math.max(0, Date.now() - new Date(session.startedAt).getTime())
    if (ms >= FOCUS_START_GRACE_MS) return 0
    return Math.max(1, Math.ceil((FOCUS_START_GRACE_MS - ms) / 1000))
  }, [session, wallTick])

  const onTagSelect = useCallback(
    (id: string) => {
      if (session) updateSessionTagId(id)
      else updateFocusSetup({ tagId: id })
    },
    [session, updateSessionTagId, updateFocusSetup]
  )

  const sessionPlanetInfo = useMemo(() => {
    if (!session) return null
    return PLANET_OPTIONS.find((p) => p.id === session.planetStyleId) ?? PLANET_OPTIONS[0]
  }, [session])

  if (!data) return <p>Loading?</p>

  const now = new Date()
  const dayStart = startOfDay(now).getTime()
  const dayEnd = endOfDay(now).getTime()
  const yStart = startOfDay(subDays(now, 1)).getTime()
  const yEnd = endOfDay(subDays(now, 1)).getTime()
  const sessions = data.sessions as { startedAt: string; actualMinutes: number }[]
  const todayMin = sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return t >= dayStart && t <= dayEnd
    })
    .reduce((a, s) => a + s.actualMinutes, 0)
  const yesterdayMin = sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return t >= yStart && t <= yEnd
    })
    .reduce((a, s) => a + s.actualMinutes, 0)

  const selectedPlanetInfo = PLANET_OPTIONS.find((p) => p.id === selectedPlanet) ?? PLANET_OPTIONS[0]

  const tTotal = Math.round(todayMin)
  const yTotal = Math.round(yesterdayMin)
  const fmtHm = (totalMin: number) => {
    const m = Math.max(0, totalMin)
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const nPlanets = carouselPlanets.length
  const centerIdx = nPlanets > 0 ? ((planetCenterIdx % nPlanets) + nPlanets) % nPlanets : 0
  const leftPlanet = nPlanets > 0 ? carouselPlanets[(centerIdx - 1 + nPlanets) % nPlanets] : PLANET_OPTIONS[0]!
  const centerPlanet = nPlanets > 0 ? carouselPlanets[centerIdx]! : PLANET_OPTIONS[0]!
  const rightPlanet = nPlanets > 0 ? carouselPlanets[(centerIdx + 1) % nPlanets] : PLANET_OPTIONS[0]!

  const activatePlanet = (planetId: string, unlocked: boolean) => {
    if (!unlocked) {
      navigate('/shop')
      setPlanetPickerOpen(false)
      return
    }
    updateFocusSetup({ planetStyleId: planetId })
    setPlanetPickerOpen(false)
  }

  return (
    <div className="focus-page app-ui-text">
      <h1>Focus</h1>

      <div className="focus-summary app-ui-text">
        <span className="focus-summary__times">
          Today <strong>{fmtHm(tTotal)}</strong>
          <span className="focus-summary__sep" aria-hidden="true" />
          Yesterday <strong>{fmtHm(yTotal)}</strong>
        </span>
        <span className="focus-summary__streak">Streak: {data.streakDays} days</span>
      </div>

      <div className="card focus-card">
        {!running && breakLeftSec === 0 && (
          <div className="focus-setup">
            <button
              type="button"
              className="focus-planet-hero"
              onClick={() => setPlanetPickerOpen(true)}
              aria-label="Choose planet"
            >
              <img src={selectedPlanetInfo.image} alt="" className="focus-planet-hero__img" />
            </button>

            <div className="focus-field focus-field--duration">
              <span className="focus-field__label">Duration</span>
              <select
                className="focus-field__control focus-field__control--duration select--metric"
                value={planned}
                onChange={(e) => updateFocusSetup({ plannedMinutes: Number(e.target.value) })}
              >
                {FOCUS_DURATION_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>

            <div className="focus-field focus-field--tag">
              <span className="focus-field__label">Tag</span>
              <div className="focus-tag-row">
                <select
                  className="focus-field__control focus-field__control--tag"
                  value={resolvedTagId}
                  onChange={(e) => onTagSelect(e.target.value)}
                >
                  {data.tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.id === data.defaultTagId ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => setTagModalOpen(true)}>
                  New tag
                </button>
              </div>
            </div>

            <label className="focus-hardcore">
              <input type="checkbox" checked={hardcore} onChange={(e) => setHardcore(e.target.checked)} />
              Hardcore mode
            </label>

            <button type="button" className="btn btn-primary focus-start" onClick={() => void start()}>
              Start
            </button>
          </div>
        )}

        {running && session && sessionPlanetInfo && (
          <div className="focus-run">
            <FocusRunningOrbit
              imageSrc={sessionPlanetInfo.image}
              progress={plannedProgress}
              overtime={elapsedSec >= session.plannedMinutes * 60}
            />
            <div className="timer-display focus-run__timer">{sessionTimerDisplay}</div>
            <p className="focus-run__status">{status}</p>
            <div className="focus-field focus-field--tag focus-run__tag">
              <span className="focus-field__label">Tag</span>
              <div className="focus-tag-row">
                <select
                  className="focus-field__control focus-field__control--tag"
                  value={resolvedTagId}
                  onChange={(e) => onTagSelect(e.target.value)}
                  aria-label="Session tag"
                >
                  {data.tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.id === data.defaultTagId ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => setTagModalOpen(true)}>
                  New tag
                </button>
              </div>
            </div>
            <button
              type="button"
              className={`btn focus-run__end${inStartGrace ? ' btn-ghost' : ' btn-danger'}`}
              onClick={() => void finishSession()}
              aria-label={
                inStartGrace
                  ? `Cancel session, ${graceLeftSec} seconds left before this run is saved`
                  : 'End focus session'
              }
            >
              {inStartGrace ? `Cancel (${graceLeftSec}s)` : 'End session'}
            </button>
          </div>
        )}
      </div>

      {planetPickerOpen && (
        <div className="modal-backdrop modal-backdrop--main" onClick={() => setPlanetPickerOpen(false)}>
          <div className="modal planet-modal planet-modal--carousel" onClick={(e) => e.stopPropagation()}>
            <h3 className="planet-modal__title">Choose planet</h3>
            <p className="planet-modal__hint">Locked planets open the Market to unlock them.</p>
            <label className="planet-modal__galaxy">
              <span className="planet-modal__galaxy-label">Group</span>
              <select
                className="planet-modal__galaxy-select focus-field__control"
                value={pickerGroup}
                onChange={(e) => {
                  setPickerGroup(e.target.value as PlanetPickerGroup)
                  setPlanetCenterIdx(0)
                }}
                aria-label="Planet group"
              >
                {PLANET_PICKER_GROUP_ORDER.map((g) => (
                  <option key={g} value={g}>
                    {PLANET_PICKER_GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </label>
            <div className="planet-carousel">
              <button
                type="button"
                className="planet-carousel__arrow"
                aria-label="Previous planets"
                disabled={nPlanets <= 1}
                onClick={() =>
                  setPlanetCenterIdx((i) => (i - 1 + nPlanets) % nPlanets)
                }
              >
                <CarouselChevron dir="left" />
              </button>
              <div className="planet-carousel__track">
                <div className="planet-carousel__slot planet-carousel__slot--side">
                  <PlanetCarouselTile
                    planet={leftPlanet}
                    unlocked={isPlanetUnlocked(
                      leftPlanet.id,
                      data.unlockedPlanetIds,
                      data.rarePlanetsUnlocked
                    )}
                    size="side"
                    onActivate={activatePlanet}
                  />
                </div>
                <div className="planet-carousel__slot planet-carousel__slot--center">
                  <PlanetCarouselTile
                    planet={centerPlanet}
                    unlocked={isPlanetUnlocked(
                      centerPlanet.id,
                      data.unlockedPlanetIds,
                      data.rarePlanetsUnlocked
                    )}
                    size="center"
                    onActivate={activatePlanet}
                  />
                </div>
                <div className="planet-carousel__slot planet-carousel__slot--side">
                  <PlanetCarouselTile
                    planet={rightPlanet}
                    unlocked={isPlanetUnlocked(
                      rightPlanet.id,
                      data.unlockedPlanetIds,
                      data.rarePlanetsUnlocked
                    )}
                    size="side"
                    onActivate={activatePlanet}
                  />
                </div>
              </div>
              <button
                type="button"
                className="planet-carousel__arrow"
                aria-label="Next planets"
                disabled={nPlanets <= 1}
                onClick={() => setPlanetCenterIdx((i) => (i + 1) % nPlanets)}
              >
                <CarouselChevron dir="right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {tagModalOpen && (
        <div className="modal-backdrop modal-backdrop--main" onClick={() => setTagModalOpen(false)}>
          <div className="modal modal--compact" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>New tag</h3>
            <label className="focus-modal-field">
              Name
              <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="e.g. Deep work" />
            </label>
            <label className="focus-modal-field">
              Kind
              <select value={newTagKind} onChange={(e) => setNewTagKind(e.target.value)}>
                <option value="general">General</option>
                <option value="programming">Programming</option>
                <option value="writing">Writing</option>
                <option value="research">Research</option>
              </select>
            </label>
            <div className="focus-modal-actions">
              <button type="button" className="btn" onClick={() => setTagModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void createTag()}>
                Add tag
              </button>
            </div>
          </div>
        </div>
      )}

      {breakLeftSec > 0 && (
        <div className="break-overlay">
          <div className="card break-card">
            <h2>Break time</h2>
            <p>Step away and recover.</p>
            <div className="timer-display" style={{ fontSize: '2.2rem', marginTop: 16 }}>
              {fmt(breakLeftSec)}
            </div>
            <p className="debris-hint">Collecting space debris (+1 every ~4s).</p>
            <button type="button" className="btn" style={{ marginTop: 20 }} onClick={() => clearBreak()}>
              Skip
            </button>
          </div>
        </div>
      )}

      {toast && <div className="achievement-toast">{toast}</div>}
    </div>
  )
}
