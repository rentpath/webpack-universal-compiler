import AggregateError from 'aggregate-error'

export async function pFinally<T>(
  promise: Promise<T>,
  onFinally: () => void = () => {}
) {
  let value

  try {
    value = await promise
  } catch (error) {
    await onFinally()
    throw error
  }

  await onFinally()
  return value
}

export const pReflect = async <T>(promise: Promise<T>) => {
  try {
    const value = await promise
    return {
      isFulfilled: true,
      isRejected: false,
      value
    }
  } catch (error) {
    return {
      isFulfilled: false,
      isRejected: true,
      reason: error
    }
  }
}

export const pTry = <T extends any[]>(fn: (...args: T) => any, ...args: any) =>
  new Promise(resolve => {
    resolve(fn(...args))
  })

export const pLimit = (concurrency: number) => {
  if (
    !(
      (Number.isInteger(concurrency) || concurrency === Infinity) &&
      concurrency > 0
    )
  ) {
    return Promise.reject(
      new TypeError('Expected `concurrency` to be a number from 1 and up')
    )
  }

  const queue: (() => void)[] = []
  let activeCount = 0

  const next = () => {
    activeCount--

    if (queue.length > 0) {
      const currentItem = queue.shift()

      if (typeof currentItem === 'function') {
        currentItem()
      }
    }
  }

  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const run = (fn, resolve, ...args) => {
    activeCount++

    const result = pTry(fn, ...args)

    resolve(result)

    result.then(next, next)
  }

  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const enqueue = (fn, resolve, ...args) => {
    if (activeCount < concurrency) {
      run(fn, resolve, ...args)
    } else {
      queue.push(run.bind(null, fn, resolve, ...args))
    }
  }

  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const generator = (fn, ...args) =>
    new Promise(resolve => enqueue(fn, resolve, ...args))

  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount
    },
    pendingCount: {
      get: () => queue.length
    }
  })

  return generator
}

export const pSettle = async <T>(promises: Promise<T>[], options: {} = {}) => {
  const { concurrency } = {
    concurrency: Infinity,
    ...options
  }

  if (!(typeof concurrency === 'number' && concurrency >= 1)) {
    throw new TypeError(
      `Expected \`concurrence\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`
    )
  }

  const limit = pLimit(concurrency)

  if (typeof limit === 'function') {
    return Promise.all(promises.map(item => pReflect(limit(() => item))))
  }

  return TypeError('Something went wrong with pSettle')
}

export const pMap = async (
  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  iterable,
  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  mapper,
  { concurrency = Infinity, stopOnError = true } = {}
) => {
  return new Promise((resolve, reject) => {
    if (typeof mapper !== 'function') {
      throw new TypeError('Mapper function is required')
    }

    if (!(typeof concurrency === 'number' && concurrency >= 1)) {
      throw new TypeError(
        `Expected \`concurrency\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`
      )
    }

    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const ret = []

    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const errors = []
    const iterator = iterable[Symbol.iterator]()
    let isRejected = false
    let isIterableDone = false
    let resolvingCount = 0
    let currentIndex = 0

    const next = () => {
      if (isRejected) {
        return
      }

      const nextItem = iterator.next()
      const i = currentIndex
      currentIndex++

      if (nextItem.done) {
        isIterableDone = true

        if (resolvingCount === 0) {
          if (!stopOnError && errors.length !== 0) {
            // @FIXME
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            reject(new AggregateError(errors))
          } else {
            // @FIXME
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            resolve(ret)
          }
        }

        return
      }

      resolvingCount++
      ;(async () => {
        try {
          const element = await nextItem.value
          ret[i] = await mapper(element, i)
          resolvingCount--
          next()
        } catch (error) {
          if (stopOnError) {
            isRejected = true
            reject(error)
          } else {
            errors.push(error)
            resolvingCount--
            next()
          }
        }
      })()
    }

    for (let i = 0; i < concurrency; i++) {
      next()

      if (isIterableDone) {
        break
      }
    }
  })
}

// @FIXME
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const map = async (map, mapper, options) => {
  const awaitedEntries = [...map.entries()].map(async ([key, value]) => [
    key,
    await value
  ])
  const values = await pMap(
    awaitedEntries,
    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    ([key, value]) => mapper(value, key),
    options
  )
  const result = new Map()

  for (const [index, key] of [...map.keys()].entries()) {
    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    result.set(key, values[index])
  }

  return result
}

// @FIXME
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const object = async (map, mapper, options) => {
  const awaitedEntries = Object.entries(map).map(async ([key, value]) => [
    key,
    await value
  ])
  const values = await pMap(
    awaitedEntries,
    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    ([key, value]) => mapper(value, key),
    options
  )
  const result = {}

  // @FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  for (const [index, key] of Object.keys(map).entries()) {
    // @FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    result[key] = values[index]
  }

  return result
}

// @FIXME
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const pProps = (input, mapper? = value => value, options?) => {
  return input instanceof Map
    ? map(input, mapper, options)
    : object(input, mapper, options)
}
