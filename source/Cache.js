const MAP = Symbol(Map)
const QUEUE = Symbol(Array)
const MAXAGE = Symbol('maxAge')
const MAXSIZE = Symbol('maxSize')

export const DEFAULTS = {
  maxAge: Infinity,  // Milliseconds before key expiration/drop
  maxSize: Infinity, // Max # of cached keys (drops Least Recently Used)
}

function toFront(value, array) {
  return [value, ...array.filter(v => v !== value)]
}

export default class Cache {
  constructor(options = DEFAULTS) {
    this[MAP] = new Map()
    this[QUEUE] = []

    this.maxAge = options.maxAge
    this.maxSize = options.maxSize

    this[Symbol.iterator] = function*() {
      for (let key of this[QUEUE]) {
        let { value } = this[MAP].get(key)
        yield { key, value }
      }
    }
  }

  cache(key, value) {
    if (key && value === undefined) return this.drop(key)

    this[QUEUE] = toFront(key, this[QUEUE])
    if (this[MAP].has(key)) {
      this[MAP].set(key, { ...this[MAP].get(key), value })
    } else {
      this[MAP].set(key, { value })
    }

    this.enforceMaxSize()
    this.expireKey(key, this.maxAge)
  }
  drop(key) {
    if (!key) return;

    if (this.maxAge !== Infinity && this[MAP].has(key)) {
      clearTimeout(this[MAP].get(key).timeout)
    }

    this[QUEUE] = this[QUEUE].filter(k => k !== key)
    this[MAP].delete(key)
  }

  get(key) {
    if (this[MAP].has(key)) {
      this[QUEUE] = toFront(key, this[QUEUE])
      this.expireKey(key, this.maxAge)
      return this[MAP].get(key).value
    }

    return null
  }

  enforceMaxSize() {
    while (this[QUEUE].length > this.maxSize) {
      this.drop(this[QUEUE][this.size - 1])
    }
  }
  expireKey(key, ms = this.maxAge) {
    const hash = this[MAP].get(key)
    if (!hash) return;

    if (hash.timeout) clearTimeout(hash.timeout)
    if (ms < Infinity) hash.timeout = setTimeout(() => this.drop(key), ms)
  }

  get maxSize() {
    return typeof this[MAXSIZE] === 'number' ? this[MAXSIZE] : DEFAULTS.maxSize
  }
  set maxSize(size) {
    const maxSize = (typeof size !== 'number' || size <= 0) ? DEFAULTS.maxSize : size
    this[MAXSIZE] = maxSize
    this.enforceMaxSize()
  }

  get maxAge() {
    return typeof this[MAXAGE] === 'number' ? this[MAXAGE] : DEFAULTS.maxAge
  }
  set maxAge(ms) {
    const maxAge = (typeof ms !== 'number' || ms <= 0) ? DEFAULTS.maxAge : ms
    this[MAXAGE] = maxAge
    this[QUEUE].forEach(key => this.expireKey(key, maxAge))
  }

  get size() { return this[QUEUE].length }
}
