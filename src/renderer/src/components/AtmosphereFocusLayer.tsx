import { useEffect, useMemo } from 'react'
import { useAppData } from '../context/DataContext'
import { useFocusSession } from '../context/FocusSessionContext'
import { useAtmosphere } from '../hooks/useAtmosphere'

const VISUAL_KEYS = ['glacier', 'station', 'deepsea'] as const
type VisualKey = (typeof VISUAL_KEYS)[number]

function toVisualKey(k: string | undefined): VisualKey | undefined {
  if (!k) return undefined
  return (VISUAL_KEYS as readonly string[]).includes(k) ? (k as VisualKey) : undefined
}

/**
 * Procedural audio + full main-pane visuals while a focus session is running.
 * Mirrors Settings atmosphere names: Glacier Storm, Space Station Low Frequency, Deep Sea Dive.
 */
export function AtmosphereFocusLayer() {
  const { data } = useAppData()
  const { session } = useFocusSession()

  const running = session !== null
  const rawKey = data?.settings.activeAtmosphereKey
  const unlocked =
    rawKey && data?.unlockedAtmosphereIds?.includes(rawKey) ? rawKey : undefined

  useAtmosphere(unlocked, running)

  const visual = useMemo(() => (running ? toVisualKey(unlocked) : undefined), [running, unlocked])

  useEffect(() => {
    const root = document.documentElement
    if (visual === 'glacier' || visual === 'station' || visual === 'deepsea') {
      root.setAttribute('data-focus-atmosphere', visual)
    } else {
      root.removeAttribute('data-focus-atmosphere')
    }
    return () => root.removeAttribute('data-focus-atmosphere')
  }, [visual])

  if (!visual) return null

  const porthole = visual === 'station'

  return (
    <div className={`atmosphere-fx atmosphere-fx--${visual}`} aria-hidden>
      {porthole ? (
        <>
          <div className="atmosphere-fx__porthole">
            <div className="atmosphere-fx__layer atmosphere-fx__layer--stars" />
            <div className="atmosphere-fx__layer atmosphere-fx__layer--a" />
            <div className="atmosphere-fx__layer atmosphere-fx__layer--b" />
            <div className="atmosphere-fx__layer atmosphere-fx__layer--c" />
          </div>
          <div className="atmosphere-fx__porthole-frame" aria-hidden />
        </>
      ) : (
        <>
          <div className="atmosphere-fx__layer atmosphere-fx__layer--a" />
          <div className="atmosphere-fx__layer atmosphere-fx__layer--b" />
          <div className="atmosphere-fx__layer atmosphere-fx__layer--c" />
        </>
      )}
    </div>
  )
}
