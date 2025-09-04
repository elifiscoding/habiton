const REMEMBER_KEY = "hb_remember_me"

export function getRememberMe() {
  try {
    const v = window.localStorage.getItem(REMEMBER_KEY)
    return v === null ? true : v === "1"
  } catch {
    return true
  }
}

function migrateAuthTokens(from, to) {
  try {
    const keys = Object.keys(from)
    for (const k of keys) {
      if (k.startsWith("sb-") && k.includes("-auth-token")) {
        const val = from.getItem(k)
        if (val != null) {
          to.setItem(k, val)
        }
        from.removeItem(k)
      }
    }
  } catch {
    // ignore
  }
}

export function setRememberMe(remember) {
  try {
    const prev = getRememberMe()
    window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0")
    if (prev !== remember) {
      if (remember) {
        // move from sessionStorage -> localStorage
        migrateAuthTokens(window.sessionStorage, window.localStorage)
      } else {
        // move from localStorage -> sessionStorage
        migrateAuthTokens(window.localStorage, window.sessionStorage)
      }
    }
  } catch {
    // ignore
  }
}

export const adaptiveAuthStorage = {
  getItem(key) {
    const store = getRememberMe() ? window.localStorage : window.sessionStorage
    return store.getItem(key)
  },
  setItem(key, value) {
    const store = getRememberMe() ? window.localStorage : window.sessionStorage
    store.setItem(key, value)
  },
  removeItem(key) {
    try { window.localStorage.removeItem(key) } catch {}
    try { window.sessionStorage.removeItem(key) } catch {}
  },
}
