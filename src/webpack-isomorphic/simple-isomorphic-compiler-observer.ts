import { EventEmitter } from 'events'
import { simpleWebpackCompiler } from '../webpack/simple-compiler'

import { ObserveWebpackIsoCompilerState } from '../types/compiler'

type Compiler = ReturnType<typeof simpleWebpackCompiler>

export const resetState = (state = {}) => {
  return Object.assign(state, {
    isCompiling: false,
    beginAt: null,
    error: null,
    compilation: {
      stats: undefined,
      duration: undefined
    }
  })
}
export function observeIsomorphicCompilers(
  clientCompiler: Compiler,
  serverCompiler: Compiler
) {
  const eventEmitter = new EventEmitter()
  const state: ObserveWebpackIsoCompilerState = resetState({})

  const onBegin = () => {
    if (state.isCompiling) {
      return
    }

    Object.assign(state, {
      isCompiling: true,
      beginAt: Date.now(),
      error: null,
      compilation: null
    })
    eventEmitter.emit('begin')
  }

  const onError = (type: string, err: NodeJS.ErrnoException) => {
    err.message += ` (${type})`
    onEnd()
  }

  const onEnd = () => {
    if (clientCompiler.isCompiling() || serverCompiler.isCompiling()) {
      return
    }

    const error = clientCompiler.getError() || serverCompiler.getError()

    if (error) {
      Object.assign(state, {
        isCompiling: false,
        error,
        compilation: null
      })
    } else {
      const compilation = {
        duration: state.beginAt ? Date.now() - state.beginAt : null,
        clientStats: clientCompiler.getCompilation().stats,
        serverStats: serverCompiler.getCompilation().stats
      }

      Object.defineProperty(compilation, 'stats', {
        value: compilation.clientStats,
        enumerable: false,
        configurable: true
      })

      Object.assign(state, {
        isCompiling: false,
        error: null,
        compilation
      })
      eventEmitter.emit('end', compilation)
    }
  }

  eventEmitter.on('error', () => {})

  clientCompiler
    .on('begin', onBegin)
    .on('end', onEnd)
    .on('error', err => onError('client', err))

  serverCompiler
    .on('begin', onBegin)
    .on('end', onEnd)
    .on('error', err => onError('server', err))

  return { eventEmitter, state }
}
