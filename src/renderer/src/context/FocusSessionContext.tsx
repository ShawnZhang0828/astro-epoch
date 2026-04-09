import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useAppData } from './DataContext'
import { isValidFocusDuration } from '../focusConstants'
import { PLANET_OPTIONS } from '../planetCatalog'

export type ActiveFocusSession = {
  startedAt: string
  plannedMinutes: number
  tagId: string
  hardcore: boolean
  planetStyleId: string
}

export type FocusSetupState = {
  plannedMinutes: number
  tagId: string
  planetStyleId: string
}

type Ctx = {
  session: ActiveFocusSession | null
  breakEndsAt: number | null
  beginSession: (s: ActiveFocusSession) => void
  clearSession: () => void
  beginBreak: (durationSec: number) => void
  clearBreak: () => void
  /** Update the active session tag (used when the timer is running). */
  updateSessionTagId: (tagId: string) => void
  focusSetup: FocusSetupState
  updateFocusSetup: (partial: Partial<FocusSetupState>) => void
}

const FocusSessionCtx = createContext<Ctx | null>(null)

const defaultFocusSetup = (): FocusSetupState => ({
  plannedMinutes: 30,
  tagId: '',
  planetStyleId: 'earth'
})

export function FocusSessionProvider({ children }: { children: React.ReactNode }) {
  const { data, refresh } = useAppData()
  const [session, setSession] = useState<ActiveFocusSession | null>(null)
  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null)
  const [focusSetup, setFocusSetup] = useState<FocusSetupState>(defaultFocusSetup)

  const diskHydratedRef = useRef(false)
  const hadSessionRef = useRef(false)

  const beginSession = useCallback((s: ActiveFocusSession) => {
    setSession(s)
  }, [])
  const clearSession = useCallback(() => setSession(null), [])
  const beginBreak = useCallback((durationSec: number) => {
    setBreakEndsAt(Date.now() + Math.max(1, durationSec) * 1000)
  }, [])
  const clearBreak = useCallback(() => setBreakEndsAt(null), [])

  const updateSessionTagId = useCallback((tagId: string) => {
    setSession((prev) => (prev ? { ...prev, tagId } : null))
  }, [])

  const updateFocusSetup = useCallback((partial: Partial<FocusSetupState>) => {
    setFocusSetup((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (session) hadSessionRef.current = true
  }, [session])

  useLayoutEffect(() => {
    if (!data || session) return
    if (diskHydratedRef.current) return
    diskHydratedRef.current = true
    if (hadSessionRef.current) return

    const s = data.settings
    setFocusSetup((prev) => ({
      plannedMinutes:
        typeof s.lastFocusPlannedMinutes === 'number' && isValidFocusDuration(s.lastFocusPlannedMinutes)
          ? s.lastFocusPlannedMinutes
          : prev.plannedMinutes,
      tagId:
        s.lastFocusTagId && data.tags.some((t) => t.id === s.lastFocusTagId)
          ? s.lastFocusTagId
          : data.defaultTagId,
      planetStyleId:
        s.lastFocusPlanetStyleId && PLANET_OPTIONS.some((p) => p.id === s.lastFocusPlanetStyleId)
          ? s.lastFocusPlanetStyleId
          : prev.planetStyleId
    }))
  }, [data, session])

  useEffect(() => {
    if (!session) return
    setFocusSetup({
      plannedMinutes: session.plannedMinutes,
      tagId: session.tagId,
      planetStyleId: session.planetStyleId
    })
  }, [session])

  useEffect(() => {
    if (!data || session) return
    setFocusSetup((prev) => {
      if (!prev.tagId || data.tags.some((t) => t.id === prev.tagId)) return prev
      return { ...prev, tagId: data.defaultTagId }
    })
  }, [data, session])

  useEffect(() => {
    if (!data || !session) return
    if (session.tagId && data.tags.some((t) => t.id === session.tagId)) return
    setSession((prev) => (prev ? { ...prev, tagId: data.defaultTagId } : null))
  }, [data, session])

  const resolvedTagIdForPersist = useMemo(() => {
    if (!data) return ''
    if (focusSetup.tagId && data.tags.some((t) => t.id === focusSetup.tagId)) return focusSetup.tagId
    return data.defaultTagId
  }, [data, focusSetup.tagId])

  useEffect(() => {
    if (!data || session) return
    if (!diskHydratedRef.current) return
    const s = data.settings
    if (
      focusSetup.plannedMinutes === s.lastFocusPlannedMinutes &&
      resolvedTagIdForPersist === s.lastFocusTagId &&
      focusSetup.planetStyleId === s.lastFocusPlanetStyleId
    ) {
      return
    }
    void window.ae
      .updateSettings({
        lastFocusPlannedMinutes: focusSetup.plannedMinutes,
        lastFocusTagId: resolvedTagIdForPersist,
        lastFocusPlanetStyleId: focusSetup.planetStyleId
      })
      .then(() => refresh())
  }, [
    focusSetup.plannedMinutes,
    focusSetup.planetStyleId,
    resolvedTagIdForPersist,
    data,
    session,
    refresh
  ])

  const value = useMemo(
    () => ({
      session,
      breakEndsAt,
      beginSession,
      clearSession,
      beginBreak,
      clearBreak,
      updateSessionTagId,
      focusSetup,
      updateFocusSetup
    }),
    [
      session,
      breakEndsAt,
      beginSession,
      clearSession,
      beginBreak,
      clearBreak,
      updateSessionTagId,
      focusSetup,
      updateFocusSetup
    ]
  )

  return <FocusSessionCtx.Provider value={value}>{children}</FocusSessionCtx.Provider>
}

export function useFocusSession() {
  const v = useContext(FocusSessionCtx)
  if (!v) throw new Error('useFocusSession requires FocusSessionProvider')
  return v
}
