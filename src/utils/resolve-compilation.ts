/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Stats } from 'webpack'
import { IFs } from 'memfs'
// @ts-ignore
import { requireFromString } from 'require-from-memory'

import { pProps } from '../utils/p-utils'

import { ClientServerCompiler } from '../types/compiler'
import { MiddlewareOptions } from '../types/middleware'

const getServerAsset = (stats: Stats.ToJsonOutput) => {
  if (stats.entrypoints) {
    const entrypoint = Object.keys(stats.entrypoints)[0]

    if (stats.assetsByChunkName) {
      const serverFileName = [stats.assetsByChunkName[entrypoint]].find(asset =>
        /\.js$/.test((asset as unknown) as string)
      )

      if (serverFileName) {
        return serverFileName
      }

      throw Object.assign(new Error('Seems that there is no server file!'), {
        hideStack: true
      })
    }

    throw Object.assign(new Error('Seems that there are no assets?'), {
      hideStack: true
    })
  }

  throw Object.assign(new Error('No Entrypoint!'), {
    hideStack: true
  })
}

function getServerFile(
  webpackConfig: ClientServerCompiler['server']['webpackConfig'],
  stats?: Stats,
  options?: MiddlewareOptions
) {
  if (stats) {
    const statsJson = stats.toJson({
      publicPath: false,
      performance: false,
      hash: false,
      timings: false,
      builtAt: false,
      chunks: false,
      modules: false,
      children: false,
      assets: true,
      version: false
    })

    return getServerAsset(statsJson)
  }

  throw Object.assign(new Error('Could not find server file!'), {
    hideStack: true
  })
}

function loadExports(
  compiler: ClientServerCompiler,
  options?: MiddlewareOptions
) {
  const { webpackConfig, webpackCompiler } = compiler.server

  const serverFile = getServerFile(
    webpackConfig,
    compiler.getCompilation().serverStats,
    options
  )
  const serverFilePath = `${
    webpackConfig.output ? webpackConfig.output.path : ''
  }/${serverFile}`

  return new Promise((res, rej) => {
    const fileExists = ((webpackCompiler.outputFileSystem as unknown) as IFs).existsSync(
      serverFilePath
    )

    if (fileExists) {
      ;((webpackCompiler.outputFileSystem as unknown) as IFs).readFile(
        serverFilePath,
        (err, buffer) => {
          if (err) {
            rej(err)
          } else if (buffer) {
            res(buffer.toString())
          }
        }
      )
    }
  })
    .then(source => requireFromString(source, serverFilePath))
    .catch(err => {
      err.detail =
        'The error above was thrown while trying to load the built server file:\n'
      err.detail += 'The PATH: ' + serverFilePath
      throw err
    })
}

export function resolveCompilation(
  compiler: ClientServerCompiler,
  options?: MiddlewareOptions
) {
  let promise: any

  return () =>
    compiler.resolve().then(compilation => {
      if (promise && promise.compilation === compilation) {
        return promise
      }

      promise = pProps({
        compilation,
        bundle: loadExports(compiler, options)
      })
      promise.compilation = compilation

      return promise
    })
}
