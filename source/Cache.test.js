import Cache, { DEFAULTS } from './Cache'

jest.useFakeTimers()

describe('Cache', () => {
  it('constructs properly', () => {
    const cache = new Cache()
    expect(cache.size).toEqual(0)
    Object.keys(DEFAULTS).forEach(key => {
      expect(cache[key]).toEqual(DEFAULTS[key])
    })
  })
  it('caches properly', () => {
    const cache = new Cache()
    cache.cache('first', 'A')

    expect(cache.size).toEqual(1)
    expect([...cache]).toEqual([{ key: 'first', value: 'A' }])

    cache.cache('second', 'B')
    expect(cache.size).toEqual(2)
    expect([...cache]).toEqual([
      { key: 'second', value: 'B' },
      { key: 'first', value: 'A' },
    ])

    cache.cache('first', 'C')
    expect(cache.size).toEqual(2)
    expect([...cache]).toEqual([
      { key: 'first', value: 'C' },
      { key: 'second', value: 'B' },
    ])
  })
  it('returns value for found keys', () => {
    const cache = new Cache()

    cache.cache(1, 'one')
    cache.cache(2, 'two')

    expect(cache.get(1)).toEqual('one')
    expect(cache.get(2)).toEqual('two')
  })
  it('returns null for not-found keys', () => {
    const cache = new Cache()

    expect(cache.get('any')).toEqual(null)
  })
  it('drops key when setting value to undefined', () => {
    const cache = new Cache()

    cache.cache('first', 'A')
    expect(cache.size).toEqual(1)

    cache.cache('first', undefined)
    expect(cache.size).toEqual(0)
  })
  it('drops key when calling drop()', () => {
    const cache = new Cache()

    cache.cache('first', 'A')
    expect(cache.size).toEqual(1)

    cache.drop('first')
    expect(cache.size).toEqual(0)
  })
  it('drops key when exceeding maxSize', () => {
    const cache = new Cache({ maxSize: 2 })

    cache.cache(1, true)
    cache.cache(2, true)
    cache.cache(3, true)

    expect([...cache]).toEqual([
      { key: 3, value: true },
      { key: 2, value: true },
    ])
  })
  it('times out keys', () => {
    const cache = new Cache({ maxAge: 60 * 1000 /* 60 sec */ })

    cache.cache(1, true)
    expect(cache.size).toEqual(1)

    jest.runAllTimers()
    expect(cache.size).toEqual(0)
  })
  it('updates expiration timers on .get(key)', () => {
    const cache = new Cache({ maxAge: 60 * 1000 /* 60 sec */ })

    cache.cache('key', 'value')
    expect(cache.size).toEqual(1)

    jest.runTimersToTime(30 * 1000 /* 30 sec */)
    expect(cache.get('key')).toEqual('value')

    jest.runTimersToTime(31 * 1000 /* 61 sec total */)
    expect(cache.size).toEqual(1)

    jest.runTimersToTime(30 * 1000 /* 91 sec total */)
    expect(cache.size).toEqual(0)
  })
  it('updates expiration timers on repeated .cache(key)', () => {
    const cache = new Cache({ maxAge: 60 * 1000 /* 60 sec */ })

    cache.cache('key', 'value')
    expect(cache.size).toEqual(1)

    jest.runTimersToTime(30 * 1000 /* 30 sec */)
    cache.cache('key', 'new value')

    jest.runTimersToTime(31 * 1000 /* 61 sec total */)
    expect(cache.size).toEqual(1)

    jest.runTimersToTime(30 * 1000 /* 91 sec total */)
    expect(cache.size).toEqual(0)
  })
})
