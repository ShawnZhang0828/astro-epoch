import { dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import activeWin from 'active-win'
import { getData, mutate } from './store'

let focusSessionActive = false
const PROMPT_COOLDOWN_MS = 5 * 60 * 1000
const WARN_COOLDOWN_MS = 2 * 60 * 1000

export function setFocusSessionActive(active: boolean): void {
  focusSessionActive = active
}

function exeMatches(list: string[], exeName: string): boolean {
  const n = exeName.toLowerCase().replace(/\.exe$/i, '')
  return list.some((p) => n.includes(p.toLowerCase()) || p.toLowerCase().includes(n))
}

export function startWindowMonitor(mainWindow: BrowserWindow): void {
  setInterval(async () => {
    const data = getData()
    if (!data.settings.monitoringEnabled) return

    let win: activeWin.Result | undefined
    try {
      win = await activeWin()
    } catch {
      return
    }
    if (!win || !('owner' in win) || !win.owner?.name) return

    const exe = win.owner.name
    const { whitelist, blacklist, lastPromptExe, lastPromptAt, lastBlacklistWarnAt, lastBlacklistWarnExe } =
      data.settings

    const black = exeMatches(blacklist, exe)
    const white = exeMatches(whitelist, exe)

    if (focusSessionActive) {
      if (black) {
        const now = Date.now()
        if (
          lastBlacklistWarnExe === exe &&
          lastBlacklistWarnAt &&
          now - lastBlacklistWarnAt < WARN_COOLDOWN_MS
        ) {
          return
        }
        mutate((d) => {
          d.settings.lastBlacklistWarnAt = now
          d.settings.lastBlacklistWarnExe = exe
        })
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: 'Astro Epoch',
            message: 'Distraction detected',
            detail: `You opened ${exe} during a focus session. Consider returning to your work when you're ready.`
          })
        }
      }
      return
    }

    if (!white || black) return

    const now = Date.now()
    if (lastPromptExe === exe && lastPromptAt && now - lastPromptAt < PROMPT_COOLDOWN_MS) return

    mutate((d) => {
      d.settings.lastPromptAt = now
      d.settings.lastPromptExe = exe
    })

    if (mainWindow && !mainWindow.isDestroyed()) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Start focus', 'Not now'],
        defaultId: 0,
        cancelId: 1,
        title: 'Astro Epoch',
        message: 'Start a focus session?',
        detail: `We noticed ${exe} in the foreground. Begin tracking focus now?`
      })
      if (response === 0) {
        mainWindow.show()
        mainWindow.webContents.send('monitor:suggest-focus', { exe })
      }
    }
  }, 2800)
}
