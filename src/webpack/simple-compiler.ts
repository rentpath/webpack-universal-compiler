import webpack, { Compiler } from 'webpack'
import assert from 'assert'

import { nodeFs } from '../helpers/node-fs'

import { observeWebpackCompiler } from './simpler-compiler-observer'
import { wrap } from '../helpers/wrap'

function preventOriginalAPIDirectUsage(
  compiler: ReturnType<typeof simpleWebpackCompiler>
) {
  const blacklistedMethods = ['run', 'watch']

  compiler.webpackCompiler = new Proxy(compiler.webpackCompiler, {
    get(target, property: keyof Compiler) {
      if (blacklistedMethods.includes(property)) {
        throw new Error(
          "Direct access to webpack compiler's public API is not allowed"
        )
      }

      return target[property]
    }
  })
}

export function simpleWebpackCompiler(
  webpackType: webpack.Compiler | webpack.Configuration
) {
  const webpackCompiler =
    'run' in webpackType ? webpackType : webpack(webpackType)
  const webpackConfig =
    'run' in webpackType ? webpackCompiler.options : webpackType

  const { eventEmitter, state, addHook } = observeWebpackCompiler(
    webpackCompiler
  )

  webpackCompiler.outputFileSystem = nodeFs()

  const compiler = Object.assign(eventEmitter, {
    webpackConfig,
    webpackCompiler,

    isCompiling() {
      return state.isCompiling
    },

    getCompilation() {
      return state.compilation
    },

    getPrettyError() {
      return state.prettyError
    },

    getError() {
      return state.error
    },

    assertIdle(calledMethod: string) {
      const getAssertMessage = (reason: string) =>
        reason +
        (calledMethod
          ? `, you can only call '${calledMethod}' when the compiler is idle`
          : '')

      assert(!state.webpackWatching, getAssertMessage('Compiler is watching'))
      assert(!state.isCompiling, getAssertMessage('Compiler is running'))
    },

    run() {
      compiler.assertIdle('run')

      return new Promise((resolve, reject) => {
        webpackCompiler.run(() => {
          if (state.prettyError) {
            reject(state.prettyError)
          }

          if (state.error) {
            reject(state.error)
          } else {
            resolve(state.compilation)
          }
        })
      })
    },

    watch(
      options: webpack.Compiler.WatchOptions,
      handler: webpack.Compiler.Watching.Handler = () => {}
    ) {
      compiler.assertIdle('watch')

      if (typeof options === 'function') {
        handler = options
        options = {}
      }

      if (typeof handler === 'undefined') {
        handler = () => {}
      }

      handler =
        handler &&
        wrap(handler, handler => {
          !state.isCompiling &&
            handler(
              state.error
                ? state.error
                : new Error('Error, no webpack error state generated'),
              (state.compilation as unknown) as webpack.Stats
            )
        })

      const webpackWatching = webpackCompiler.watch(options, handler)

      return () => {
        if (webpackWatching !== state.webpackWatching) {
          return
        }

        eventEmitter.emit('invalidate')
        state.webpackWatching.invalidate()
      }
    },

    unwatch() {
      if (!state.webpackWatching) {
        return Promise.resolve()
      }

      return new Promise(resolve => {
        addHook('watchClose', resolve)
        state.webpackWatching && state.webpackWatching.close(() => {})
      })
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

  preventOriginalAPIDirectUsage(compiler)

  return compiler
}
