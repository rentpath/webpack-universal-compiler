import { Request, Response, NextFunction } from 'express'
import { Compiler, OutputFileSystem } from 'webpack'
import { compose } from 'compose-middleware'
import webpackDevMiddleware, {
  WebpackDevMiddleware
} from 'webpack-dev-middleware'

import { MiddlewareOptions } from '../types/middleware'
import { ClientServerCompiler } from '../types/compiler'

function createStubbedWebpackCompiler(webpackCompiler: Compiler) {
  // Make `run` and `watch` no-ops
  // Additionally, we don't want the dev-middleware to be notified of anything, except for the `done` hook
  const doneHandlers = []

  const stubbedWebpackCompilerHooks = new Proxy(
    {},
    {
      get(target, property) {
        if (property === 'done') {
          return {
            tap: (name, handler) => doneHandlers.push(handler)
          }
        }

        return {
          tap: () => {}
        }
      },
      set() {
        /* istanbul ignore next */
        return true
      }
    }
  )

  const stubbedWebpackCompiler = new Proxy(webpackCompiler, {
    get(target, property) {
      if (property === 'run' || property === 'watch') {
        return () => {}
      }

      // The hooks API is for webpack >= v4
      if (property === 'hooks') {
        return stubbedWebpackCompilerHooks
      }

      return target[property]
    },
    set() {
      // Do not modify any property of the compiler, specially the `outputFileSystem`
      return true
    }
  })

  return {
    stubbedWebpackCompiler,
    notifyDone: stats => doneHandlers.forEach(handler => handler(stats))
  }
}

export function devMiddleware(
  compiler: ClientServerCompiler,
  options: MiddlewareOptions
) {
  const { webpackCompiler, webpackConfig } = compiler.client

  const { stubbedWebpackCompiler, notifyDone } = createStubbedWebpackCompiler(
    webpackCompiler
  )

  const devMiddleware = webpackDevMiddleware(stubbedWebpackCompiler, {
    logLevel: 'silent',
    publicPath:
      webpackConfig.output && webpackConfig.output.publicPath
        ? webpackConfig.output.publicPath
        : '/',
    watchOptions: undefined,
    index: 'blah-blah-index-blah',
    headers: options.headers
  })

  if (webpackCompiler.outputFileSystem !== devMiddleware.fileSystem) {
    for (const key in webpackCompiler.outputFileSystem) {
      if (
        typeof webpackCompiler.outputFileSystem[
          key as keyof OutputFileSystem
        ] === 'function'
      ) {
        devMiddleware.fileSystem[
          key as keyof WebpackDevMiddleware['fileSystem']
        ] = webpackCompiler.outputFileSystem[
          key as keyof OutputFileSystem
        ].bind(webpackCompiler.outputFileSystem)
      }
    }
  }

  return compose([
    (_req: Request, res: Response, next: NextFunction) => {
      const { clientStats } = res.locals.universal.compilation

      notifyDone(clientStats)
      next()
    },
    devMiddleware
  ])
}
