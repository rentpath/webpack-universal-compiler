import webpack from 'webpack'
import { simpleWebpackCompiler } from '../webpack/simple-compiler'
import {
  observeIsomorphicCompilers,
  resetState
} from './simple-isomorphic-compiler-observer'
import { pSettle } from '../helpers/p-utils'
import { wrap } from '../helpers/wrap'
import { webpackConfigValidator } from '../helpers/webpack-config-sort'

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
        if (state.prettyError) {
          return Promise.reject(state.prettyError)
        }

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

    resolve() {
      const { error, compilation, prettyError } = state

      if (prettyError) {
        return Promise.reject(prettyError)
      }

      if (error) {
        return Promise.reject(error)
      }

      if (compilation) {
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
      }

      const onError = (err: webpack.Stats) => {
        cleanup()

        if (deferred.reject) {
          deferred.reject(err)
        }
      }

      const onEnd = (compilation: webpack.Stats) => {
        cleanup()

        if (deferred.resolve) {
          deferred.resolve(compilation)
        }
      }

      compiler.on('error', onError).on('end', onEnd)

      return deferred.promise
    }
  })

  return compiler
}
