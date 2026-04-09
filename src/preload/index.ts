import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ae', {
  getData: () => ipcRenderer.invoke('data:get'),
  setFocusActive: (active: boolean) => ipcRenderer.invoke('focus:set-active', active),
  previewRewards: (payload: { plannedMinutes: number; tagId: string; hardcore: boolean }) =>
    ipcRenderer.invoke('rewards:preview', payload),
  endSession: (payload: {
    plannedMinutes: number
    actualMinutes: number
    tagId: string
    hardcore: boolean
    startedAt: string
    planetStyleId?: string
  }) => ipcRenderer.invoke('session:end', payload),
  creditBreak: (amount: number) => ipcRenderer.invoke('break:credit', amount),
  createTag: (name: string, kind: string) => ipcRenderer.invoke('tag:create', name, kind),
  setDefaultTag: (tagId: string) => ipcRenderer.invoke('tag:set-default', tagId),
  buyItem: (itemId: string) => ipcRenderer.invoke('shop:buy', itemId),
  listShop: () => ipcRenderer.invoke('shop:list'),
  equipOrbiters: (ids: string[]) => ipcRenderer.invoke('orbiters:equip', ids),
  setTheme: (themeId: string) => ipcRenderer.invoke('theme:set', themeId),
  updateSettings: (partial: Record<string, unknown>) => ipcRenderer.invoke('settings:update', partial),
  onSuggestFocus: (cb: (p: { exe: string }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, p: { exe: string }) => cb(p)
    ipcRenderer.on('monitor:suggest-focus', fn)
    return () => ipcRenderer.removeListener('monitor:suggest-focus', fn)
  }
})
