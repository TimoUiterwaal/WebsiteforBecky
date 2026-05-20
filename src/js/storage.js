export function getState(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function setState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function updateState(key, updater, fallback = {}) {
  setState(key, updater(getState(key, fallback)))
}
