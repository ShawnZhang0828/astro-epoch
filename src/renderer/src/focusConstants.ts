/** Allowed focus session lengths in minutes (shared by Focus page and persisted prefs). */
export const FOCUS_DURATION_MINUTES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120] as const

/** Stopping within this many ms after start does not record a session (no history, rewards, or break). */
export const FOCUS_START_GRACE_MS = 10_000

export function isValidFocusDuration(minutes: number): boolean {
  return (FOCUS_DURATION_MINUTES as readonly number[]).includes(minutes)
}
