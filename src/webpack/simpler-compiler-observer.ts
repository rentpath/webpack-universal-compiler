import { EventEmitter } from 'events'
import webpack from 'webpack'
import { Tapable } from 'tapable'

import { wrap } from '../helpers/wrap'
import { ObserveWebpackCompilerState } from '../types/compiler'

const createAddHook = (webpackCompiler: webpack.Compiler) => <
  Name extends keyof typeof webpackCompiler.hooks
>(
  name: Name,
  method: 'tap' | 'tapAsync' | Tapable.Handler,
  callback?: Tapable.Handler
) => {
  if (typeof method === 'function') {
    callback = method
    method = 'tap'
  }

  if (callback && webpackCompiler.hooks) {
    webpackCompiler.hooks[name][method](
      'simple-compiler',
      (...args) => callback && callback(...args)
    )
  }
}

export function observeWebpackCompiler(webpackCompiler: webpack.Compiler) {
  const eventEmitter = new EventEmitter()
  const state: ObserveWebpackCompilerState = {
    isCompiling: false,
    error: null,
    compilation: {
      duration: undefined
    },
    webpackWatching: null
  }
  const addHook = createAddHook(webpackCompiler)

  // Avoid NodeJS global throw if there's no error listeners
  eventEmitter.on('error', () => {})

  webpackCompiler.run = wrap(webpackCompiler.run, (run, callback) => {
    Object.assign(state, {
      isCompiling: true,
      error: null,
      compilation: null
    })
    eventEmitter.emit('begin')

    run.call(webpackCompiler, (error, stats) => {
      if (error) {
        Object.assign(state, {
          isCompiling: false,
          error,
          compilation: null
        })
        eventEmitter.emit('error', error)
      }

      callback(error, stats)
    })
  })

  addHook('done', (stats: webpack.Stats) => {
    if (stats.hasErrors()) {
      const error = Object.assign(new Error('Webpack compilation failed'), {
        stats
      })

      Object.assign(state, {
        isCompiling: false,
        error,
        compilation: null
      })

      eventEmitter.emit('error', error)
    } else {
      Object.assign(state, {
        isCompiling: false,
        error: null,
        compilation: {
          stats,
          duration:
            stats.endTime && stats.startTime
              ? stats.endTime - stats.startTime
              : null
        }
      })
      eventEmitter.emit('end', state.compilation)
    }
  })

  addHook(
    'watchRun',
    'tapAsync',
    (_compiler: webpack.Compiler, callback: () => void) => {
      Object.assign(state, {
        isCompiling: true,
        error: null,
        compilation: null
      })
      eventEmitter.emit('begin')
      callback()
    }
  )

  addHook('failed', error => {
    Object.assign(state, { isCompiling: false, error, compilation: null })
    eventEmitter.emit('error', error)
  })

  webpackCompiler.watch = wrap(
    webpackCompiler.watch,
    (watch, options, handler) => {
      state.webpackWatching = watch.call(webpackCompiler, options, handler)

      return state.webpackWatching
    }
  )

  addHook('watchClose', () => {
    state.webpackWatching = null

    if (state.isCompiling) {
      const error = Object.assign(new Error('Webpack compilation cancelled'), {
        hideStack: true
      })

      Object.assign(state, { isCompiling: false, error, compilation: null })
      eventEmitter.emit('error', error)
    }
  })

  return {
    eventEmitter,
    state,
    addHook
  }
}
