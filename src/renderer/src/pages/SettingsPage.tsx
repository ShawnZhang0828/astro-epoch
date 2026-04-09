import { useEffect, useState } from 'react'
import { useAppData } from '../context/DataContext'

export default function SettingsPage() {
  const { data, refresh } = useAppData()
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [tagName, setTagName] = useState('')
  const [tagKind, setTagKind] = useState('general')

  useEffect(() => {
    if (!data) return
    setWhite(data.settings.whitelist.join('\n'))
    setBlack(data.settings.blacklist.join('\n'))
  }, [data])

  if (!data) return <p>Loading…</p>

  const saveLists = async () => {
    const wl = white
      .split(/[\n,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const bl = black
      .split(/[\n,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    await window.ae.updateSettings({ whitelist: wl, blacklist: bl })
    await refresh()
  }

  const atmospheres = [
    { key: '', label: 'None' },
    { key: 'glacier', label: 'Glacier Storm' },
    { key: 'station', label: 'Space Station Low Frequency' },
    { key: 'deepsea', label: 'Deep Sea Dive' }
  ]

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Tags</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Every session uses a tag. If you do not pick one on the Focus screen, your default tag applies. Use kinds so
          orbiters can match (e.g. Programming).
        </p>
        <div className="row" style={{ marginBottom: 12 }}>
          <select value={data.defaultTagId} onChange={(e) => void window.ae.setDefaultTag(e.target.value).then(refresh)}>
            {data.tags.map((t) => (
              <option key={t.id} value={t.id}>
                Default: {t.name} ({t.kind})
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <input placeholder="New tag name" value={tagName} onChange={(e) => setTagName(e.target.value)} />
          <select value={tagKind} onChange={(e) => setTagKind(e.target.value)}>
            <option value="general">General</option>
            <option value="programming">Programming</option>
            <option value="writing">Writing</option>
            <option value="research">Research</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              void window.ae.createTag(tagName, tagKind).then(() => {
                setTagName('')
                void refresh()
              })
            }
          >
            Add tag
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Hardcore default</h2>
        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={data.settings.hardcoreDefault}
            onChange={(e) =>
              void window.ae.updateSettings({ hardcoreDefault: e.target.checked }).then(refresh)
            }
          />
          New sessions start in Hardcore when enabled
        </label>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Active window monitoring</h2>
        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={data.settings.monitoringEnabled}
            onChange={(e) =>
              void window.ae.updateSettings({ monitoringEnabled: e.target.checked }).then(refresh)
            }
          />
          Enable whitelist/blacklist prompts (Windows foreground app)
        </label>
        <h2>Whitelist (suggest focus)</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>One entry per line — partial process names, no .exe required.</p>
        <textarea value={white} onChange={(e) => setWhite(e.target.value)} />
        <h2>Blacklist (block prompt & warn during focus)</h2>
        <textarea value={black} onChange={(e) => setBlack(e.target.value)} />
        <button type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => void saveLists()}>
          Save lists
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Focus atmosphere</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Procedural ambience during focus when unlocked in the shop.</p>
        <select
          value={data.settings.activeAtmosphereKey ?? ''}
          onChange={(e) => void window.ae.updateSettings({ activeAtmosphereKey: e.target.value }).then(refresh)}
        >
          {atmospheres.map((a) => (
            <option key={a.key || 'none'} value={a.key} disabled={!!a.key && !data.unlockedAtmosphereIds.includes(a.key)}>
              {a.label}
              {a.key && !data.unlockedAtmosphereIds.includes(a.key) ? ' (locked)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>UI theme</h2>
        <select
          value={data.activeThemeId}
          onChange={(e) => void window.ae.setTheme(e.target.value).then(refresh)}
        >
          <option value="default">Default nebula</option>
          <option value="aurora" disabled={!data.purchasedItemIds.includes('theme-aurora')}>
            Aurora Borealis {!data.purchasedItemIds.includes('theme-aurora') ? '(locked)' : ''}
          </option>
          <option value="solar" disabled={!data.purchasedItemIds.includes('theme-solar')}>
            Solar Flare {!data.purchasedItemIds.includes('theme-solar') ? '(locked)' : ''}
          </option>
        </select>
      </div>
    </div>
  )
}
