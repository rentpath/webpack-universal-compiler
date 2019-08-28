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

  const run = (fn, resolve, ...args) => {
    activeCount++

    const result = pTry(fn, ...args)

    resolve(result)

    result.then(next, next)
  }

  const enqueue = (fn, resolve, ...args) => {
    if (activeCount < concurrency) {
      run(fn, resolve, ...args)
    } else {
      queue.push(run.bind(null, fn, resolve, ...args))
    }
  }

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
}
