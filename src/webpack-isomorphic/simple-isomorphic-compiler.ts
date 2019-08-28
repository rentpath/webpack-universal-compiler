import webpack from 'webpack'
import { simpleWebpackCompiler } from '../webpack/simple-compiler'
import {
  observeIsomorphicCompilers,
  resetState
} from './simple-isomorphic-compiler-observer'
import { pSettle } from '../helpers/p-utils'
import { wrap } from '../helpers/wrap'

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
      options: webpack.Compiler.WatchOptions,
      handler: webpack.Compiler.Watching.Handler
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
          !state.isCompiling &&
            handler(
              state.error
                ? state.error
                : new Error('Error, no webpack error state generated'),
              (state.compilation as any) as webpack.Stats
            )
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
      const { error, compilation } = state

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
