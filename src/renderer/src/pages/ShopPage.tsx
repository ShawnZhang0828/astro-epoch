import { useEffect, useState } from 'react'
import { StardustGlyph } from '../components/StardustGlyph'
import { useAppData } from '../context/DataContext'
import type { ShopItemDTO } from '../env'
import { ITEM_ICON_BY_ID } from '../itemIcons'
import { EXO_SHOP_ITEM_IDS_ORDER } from '../exhibition/exoPlanetBundles'

/** Orbital order for solar cores; Milky Way nebula cores after outer planets in catalog. */
const SOLAR_CORE_ORDER = [
  'core-barren',
  'core-venus',
  'core-gas-giant',
  'core-cyber',
  'core-uranus',
  'core-neptune'
] as const

const MILKY_CORE_ORDER = ['core-milky-nebula', 'core-milky-void'] as const

function sortByIdOrder<T extends { id: string }>(list: T[], order: readonly string[]): T[] {
  const rank = (id: string) => {
    const i = order.indexOf(id)
    return i === -1 ? order.length + 1 : i
  }
  return [...list].sort((a, b) => rank(a.id) - rank(b.id))
}

function MarketItemCard({
  item,
  owned,
  onRequestPurchase
}: {
  item: ShopItemDTO
  owned: boolean
  onRequestPurchase: (item: ShopItemDTO) => void
}) {
  const icon = ITEM_ICON_BY_ID[item.id]
  return (
    <article className={`market-card${owned ? ' market-card--owned' : ''}`}>
      <div className="market-card__top">
        <div className="market-card__icon-wrap">
          {icon ? <img src={icon} alt="" className="market-card__icon" /> : <div className="market-card__icon market-card__icon--placeholder" />}
        </div>
        <div className="market-card__body">
          <h3 className="market-card__name">{item.name}</h3>
          <p className="market-card__desc">{item.description}</p>
        </div>
      </div>
      <div className="market-card__footer">
        <span className="market-card__price" aria-label={`${item.price} Stardust`}>
          <span className="market-card__price-val">{item.price}</span>
          <StardustGlyph variant="inline" className="market-card__price-icon" aria-hidden />
        </span>
        <button
          type="button"
          className="btn btn-primary market-card__btn"
          disabled={owned}
          onClick={() => onRequestPurchase(item)}
        >
          {owned ? 'Owned' : 'Buy'}
        </button>
      </div>
    </article>
  )
}

export default function ShopPage() {
  const { data, refresh } = useAppData()
  const [items, setItems] = useState<ShopItemDTO[]>([])
  const [pendingPurchase, setPendingPurchase] = useState<ShopItemDTO | null>(null)

  useEffect(() => {
    void window.ae.listShop().then(setItems)
  }, [])

  useEffect(() => {
    if (!pendingPurchase) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingPurchase(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingPurchase])

  if (!data) return <p>Loading?</p>

  const confirmPurchase = async () => {
    if (!pendingPurchase) return
    const id = pendingPurchase.id
    const r = await window.ae.buyItem(id)
    if (!r.ok) {
      alert(r.error ?? 'Purchase failed')
      return
    }
    setPendingPurchase(null)
    await refresh()
  }

  const canAfford = pendingPurchase ? data.stardust >= pendingPurchase.price : false

  const groups: Record<string, ShopItemDTO[]> = {}
  for (const i of items) {
    groups[i.category] = groups[i.category] ?? []
    groups[i.category].push(i)
  }

  const label = (c: string) =>
    ({
      planet_core: 'Planet cores',
      orbiter: 'Orbiters',
      atmosphere: 'Atmosphere',
      theme: 'Themes'
    }[c] ?? c)

  const sortExoCores = (list: ShopItemDTO[]) =>
    sortByIdOrder(
      list.filter((i) => i.galaxyRegion === 'exo_systems'),
      EXO_SHOP_ITEM_IDS_ORDER
    )

  return (
    <div className="market-page">
      {pendingPurchase && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setPendingPurchase(null)}
        >
          <div
            className="modal market-purchase-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-purchase-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="market-purchase-title" className="market-purchase-modal__title">
              Confirm purchase
            </h3>
            <p className="market-purchase-modal__body">
              Buy <strong>{pendingPurchase.name}</strong> for{' '}
              <strong
                className="market-purchase-modal__stardust-amt"
                aria-label={`${pendingPurchase.price} Stardust`}
              >
                {pendingPurchase.price}{' '}
                <StardustGlyph variant="inline" className="market-stardust-icon" aria-hidden />
              </strong>
              ?
            </p>
            <p className="market-purchase-modal__balance">
              Balance:{' '}
              <strong aria-label={`${data.stardust} Stardust`}>
                {data.stardust}{' '}
                <StardustGlyph variant="inline" className="market-stardust-icon" aria-hidden />
              </strong>
            </p>
            {!canAfford && (
              <p className="market-purchase-modal__warn" aria-label="Not enough Stardust for this item.">
                Not enough{' '}
                <StardustGlyph variant="inline" className="market-stardust-icon" aria-hidden />
                {' '}for this item.
              </p>
            )}
            <div className="focus-modal-actions">
              <button type="button" className="btn" onClick={() => setPendingPurchase(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canAfford}
                onClick={() => void confirmPurchase()}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="market-header">
        <h1>Market</h1>
      </header>

      {Object.entries(groups).map(([cat, list]) => {
        if (cat === 'planet_core') {
          const exo = sortExoCores(list)
          const exoK90 = exo.filter((i) => i.id.startsWith('core-exo-k90-'))
          const exoHd = exo.filter((i) => i.id.startsWith('core-exo-hd10180-'))
          const exoT1 = exo.filter((i) => i.id.startsWith('core-exo-t1-'))
          const exoK452 = exo.filter((i) => i.id.startsWith('core-exo-k452-'))
          const milky = sortByIdOrder(
            list.filter((i) => i.galaxyRegion === 'milky_way'),
            MILKY_CORE_ORDER
          )
          const solar = sortByIdOrder(
            list.filter((i) => i.galaxyRegion === 'solar_system'),
            SOLAR_CORE_ORDER
          )
          return (
            <section key={cat} className="market-section">
              <h2 className="market-section__title">{label(cat)}</h2>
              <h3 className="market-subsection__title">Solar system</h3>
              <div className="market-grid">
                {solar.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
              <h3 className="market-subsection__title market-subsection__title--spaced">Milky Way</h3>
              <div className="market-grid">
                {milky.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
              <h3 className="market-subsection__title market-subsection__title--spaced">Kepler-90</h3>
              <div className="market-grid">
                {exoK90.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
              <h3 className="market-subsection__title market-subsection__title--spaced">HD 10180</h3>
              <div className="market-grid">
                {exoHd.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
              <h3 className="market-subsection__title market-subsection__title--spaced">TRAPPIST-1</h3>
              <div className="market-grid">
                {exoT1.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
              <h3 className="market-subsection__title market-subsection__title--spaced">Kepler-452</h3>
              <div className="market-grid">
                {exoK452.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    owned={data.purchasedItemIds.includes(item.id)}
                    onRequestPurchase={setPendingPurchase}
                  />
                ))}
              </div>
            </section>
          )
        }

        return (
          <section key={cat} className="market-section">
            <h2 className="market-section__title">{label(cat)}</h2>
            <div className="market-grid">
              {list.map((item) => (
                <MarketItemCard
                  key={item.id}
                  item={item}
                  owned={data.purchasedItemIds.includes(item.id)}
                  onRequestPurchase={setPendingPurchase}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
