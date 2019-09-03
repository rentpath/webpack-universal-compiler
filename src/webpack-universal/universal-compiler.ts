import webpack from 'webpack'

import { wrap } from '../helpers/fp-functions'
import { webpackConfigValidator } from '../helpers/webpack-config-sort'
import { pSettle } from '../utils/p-utils'
import { simpleWebpackCompiler } from '../webpack/compiler'

import {
  observeIsomorphicCompilers,
  resetState
} from './universal-compiler-observer'
import { ObserveWebpackIsoCompilerState, ErrWithStats } from '../types/compiler'

const createSubFacade = (
  compiler: ReturnType<typeof simpleWebpackCompiler>
) => ({
  webpackConfig: compiler.webpackConfig,
  webpackCompiler: compiler.webpackCompiler
})

export function clientServerCompiler(
  client: webpack.Compiler | webpack.Configuration,
  server: webpack.Compiler | webpack.Configuration
) {
  if (!webpackConfigValidator(client, server)) {
    throw new TypeError('Incorrect Configuration')
  }

  const clientCompiler = simpleWebpackCompiler(client)
  const serverCompiler = simpleWebpackCompiler(server)
  const { eventEmitter, state } = observeIsomorphicCompilers(
    clientCompiler,
    serverCompiler
  )

  const compiler = Object.assign(eventEmitter, {
    client: createSubFacade(clientCompiler),
    server: createSubFacade(serverCompiler),

    isCompiling() {
      return state.isCompiling
    },

    getCompilation() {
      return state.compilation
    },

    getError() {
      return state.error
    },

    run() {
      clientCompiler.assertIdle('run')
      serverCompiler.assertIdle('run')

      return pSettle([clientCompiler.run(), serverCompiler.run()]).then(() => {
        if (state.error) {
          throw state.error
        }

        return state.compilation
      })
    },

    watch(
      options?: webpack.Compiler.WatchOptions,
      handler?: (
        err: Error | undefined,
        stats: {
          duration?: number
          clientStats?: webpack.Stats
          serverStats?: webpack.Stats
        }
      ) => void
    ) {
      clientCompiler.assertIdle('watch')
      serverCompiler.assertIdle('watch')

      if (typeof options === 'function') {
        handler = options
        options = {}
      }

      handler =
        handler &&
        wrap(handler, handler => {
          if (!state.isCompiling) {
            if (state.error) {
              handler(state.error, state.compilation)
            }

            handler(undefined, state.compilation)
          }
        })

      const clientInvalidate = clientCompiler.watch(options, handler)
      const serverInvalidate = serverCompiler.watch(options, handler)

      return () => {
        eventEmitter.emit('invalidate')
        resetState(state)

        clientInvalidate()
        serverInvalidate()
      }
    },

    unwatch() {
      return Promise.all([
        clientCompiler.unwatch(),
        serverCompiler.unwatch()
      ]).then(() => {})
    },

    resolve(): Promise<ObserveWebpackIsoCompilerState['compilation']> {
      const { error, compilation, lastStats } = state

      if (error) {
        if (lastStats.serverStats && lastStats.clientStats) {
          const { clientStats, serverStats } = lastStats

          return Promise.resolve({
            duration: 0,
            clientStats,
            serverStats
          })
        }
        return Promise.reject(error)
      }

      if (compilation && compilation.clientStats && compilation.serverStats) {
        return Promise.resolve(compilation)
      }

      const deferred: {
        promise?: Promise<any>
        resolve?: (any: any) => void
        reject?: (any: any) => void
      } = {
        resolve: undefined
      }

      deferred.promise = new Promise((res, rej) => {
        deferred.resolve = res
        deferred.reject = rej
      })

      const cleanup = () => {
        eventEmitter.removeListener('error', onError)
        eventEmitter.removeListener('end', onEnd)
        resetState(state)
      }

      const onError = (err: ErrWithStats) => {
        cleanup()

        if (deferred.reject) {
          deferred.reject(err)
        }
      }

      const onEnd = (
        compilation: ObserveWebpackIsoCompilerState['compilation']
      ) => {
        cleanup()

        if (deferred.resolve) {
          if (compilation.clientStats && compilation.serverStats) {
            deferred.resolve(compilation)
          }
        }
      }

      compiler.on('error', onError).on('end', onEnd)

      return deferred.promise
    }
  })

  return compiler
}
