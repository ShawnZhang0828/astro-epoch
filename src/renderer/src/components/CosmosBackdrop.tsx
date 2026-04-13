import { useMemo } from 'react'

function CosmosStarfield() {
  const stars = useMemo(() => {
    let seed = 0x9e3779b9
    const rnd = () => {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1)
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61)
      return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296
    }
    return Array.from({ length: 28 }, (_, i) => {
      rnd()
      return {
        id: i,
        left: rnd() * 100,
        top: rnd() * 100,
        size: 1 + rnd() * 2.25,
        o: 0.22 + rnd() * 0.58
      }
    })
  }, [])
  return (
    <div className="page-cosmos__stars">
      {stars.map((s) => (
        <span
          key={s.id}
          className="page-cosmos__star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.o
          }}
        />
      ))}
    </div>
  )
}

/** Fixed gradient + starfield for the main pane (right of sidebar). */
export function CosmosBackdrop() {
  return (
    <div className="page-cosmos__backdrop" aria-hidden>
      <div className="page-cosmos__gradient" />
      <CosmosStarfield />
    </div>
  )
}
