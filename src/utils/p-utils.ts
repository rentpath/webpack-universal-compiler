/* eslint-disable @typescript-eslint/ban-ts-ignore */
import AggregateError from "aggregate-error"

export async function pFinally<T>(
  promise: Promise<T> | (() => Promise<T>),
  onFinally: () => void = () => {
    // void
  }
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

export const pTry = <TArgs, TResult>(
  fn: (...args: TArgs[]) => TResult,
  ...args: TArgs[]
) =>
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
      new TypeError("Expected `concurrency` to be a number from 1 and up")
    )
  }

  const queue: (() => void)[] = []
  let activeCount = 0

  const next = () => {
    activeCount--

    if (queue.length > 0) {
      const currentItem = queue.shift()

      if (typeof currentItem === "function") {
        currentItem()
      }
    }
  }

  const run = <T, TArgs extends any[]>(
    fn: () => Promise<T>,
    resolve: <T>(value?: Promise<T>) => void,
    ...args: TArgs
  ) => {
    activeCount++

    const result = pTry(fn, ...args)

    resolve(result)

    result.then(next, next)
  }

  const enqueue = <T, TArgs extends any[]>(
    fn: () => Promise<T>,
    resolve: <T>(value?: Promise<T>) => void,
    ...args: TArgs
  ) => {
    if (activeCount < concurrency) {
      run(fn, resolve, ...args)
    } else {
      queue.push(run.bind(null, fn, resolve, ...args))
    }
  }

  const generator = <T, TArgs extends any[]>(
    fn: () => Promise<T>,
    ...args: TArgs
  ) => new Promise(resolve => enqueue(fn, resolve, ...args))

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

  if (!(typeof concurrency === "number" && concurrency >= 1)) {
    throw new TypeError(
      `Expected \`concurrence\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`
    )
  }

  const limit = pLimit(concurrency)

  if (typeof limit === "function") {
    return Promise.all(promises.map(item => pReflect(limit(() => item))))
  }

  return TypeError("Something went wrong with pSettle")
}

type TheMapper<Element = any, NewElement = any> = (
  element: Element,
  index: number
) => NewElement | PromiseLike<NewElement>

export const pMap = async <T, NewT>(
  iterable: Iterable<T>,
  mapper: TheMapper<T, NewT>,
  { concurrency = Infinity, stopOnError = true } = {}
): Promise<NewT[]> => {
  return new Promise((resolve, reject) => {
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required")
    }

    if (!(typeof concurrency === "number" && concurrency >= 1)) {
      throw new TypeError(
        `Expected \`concurrency\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`
      )
    }

    const ret: NewT[] = []
    const errors: Error[] = []
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
            reject(new AggregateError(errors))
          } else {
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

type IterableObject<T> = { [K in keyof T]: T[K] } & {
  [Symbol.iterator](): Iterator<T>
}

const object = async <
  InputType extends { [key: string]: any },
  ValueType extends InputType[keyof InputType],
  MappedValueType = PromiseResult<ValueType>
>(
  map: InputType,
  mapper: Mapper<PromiseResult<ValueType>, ValueType, MappedValueType>,
  options?: PMapOptions
) => {
  const awaitedEntries: IterableObject<any> = Object.entries(
    map
  ).map(async ([key, value]) => [key, await value])
  const values = await pMap(
    awaitedEntries,
    ([key, value]) => mapper(value, key),
    options
  )
  const result = {}

  for (const [index, key] of Object.keys(map).entries()) {
    // @ts-ignore
    result[key] = values[index]
  }

  return result
}

const mapAMap = async <
  KeyType,
  ValueType,
  MappedValueType = PromiseResult<ValueType>
>(
  map: Map<KeyType, ValueType>,
  mapper: Mapper<PromiseResult<ValueType>, KeyType, MappedValueType>,
  options?: PMapOptions
) => {
  const awaitedEntries: IterableObject<any> = [
    ...map.entries()
  ].map(async ([key, value]) => [key, await value])
  const values = await pMap(
    awaitedEntries,
    ([key, value]) => mapper(value, key),
    options
  )
  const result = new Map()

  for (const [index, key] of [...map.keys()].entries()) {
    result.set(key, values[index])
  }

  return result
}

interface PMapOptions {
  concurrency?: number
  stopOnError?: boolean
}

type PromiseResult<Value> = Value extends PromiseLike<infer Result>
  ? Result
  : Value

type Mapper<ValueType, KeyType, MappedValueType> = (
  value: ValueType,
  key: KeyType
) => MappedValueType | PromiseLike<MappedValueType>

type BlankMapper<ValueType> = (value: ValueType) => ValueType

export function pProps<
  KeyType,
  ValueType,
  MappedValueType = PromiseResult<ValueType>
>(
  map: Map<KeyType, ValueType>,
  mapper?: Mapper<PromiseResult<ValueType>, KeyType, MappedValueType>,
  options?: PMapOptions
): Promise<Map<KeyType, MappedValueType>>
export function pProps<
  InputType extends { [key: string]: any },
  ValueType extends InputType[keyof InputType],
  MappedValueType = PromiseResult<ValueType>
>(
  map: InputType,
  mapper:
    | Mapper<PromiseResult<ValueType>, keyof InputType, MappedValueType>
    | BlankMapper<PromiseResult<ValueType>> = (value: any) => value,
  options?: PMapOptions
): Promise<{ [key in keyof InputType]: MappedValueType }> {
  // @ts-ignore
  return map instanceof Map
    ? mapAMap(map, mapper, options)
    : object(map, mapper, options)
}
