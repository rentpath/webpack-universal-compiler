/* eslint-disable @typescript-eslint/ban-ts-ignore */
import fs from 'fs'
import { Stats } from 'webpack'
import { IFs } from 'memfs'
import { requireFromString } from '../helpers/require-from-memory'
import { patchRequire, patchFs } from 'fs-monkey'
import { ufs } from 'unionfs'

import { pProps } from '../utils/p-utils'

import { ClientServerCompiler } from '../types/compiler'
import { MiddlewareOptions } from '../types/middleware'

const ofs = {
  ...fs
}

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

/**
 * Removes a module from the cache
 */
function purgeCache(moduleName) {
  // Traverse the cache looking for the files
  // loaded by the specified module name
  searchCache(moduleName, function(mod) {
    delete require.cache[mod.id]
  })

  // Remove cached paths to the module.
  // Thanks to @bentael for pointing this out.
  Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete module.constructor._pathCache[cacheKey]
    }
  })
}

/**
 * Traverses the cache to search for all the cached
 * files of the specified module name
 */
function searchCache(moduleName, callback) {
  // Resolve the module identified by the specified name
  let mod = require.resolve(moduleName)

  // Check if the module has been resolved and found within
  // the cache
  if (mod && (mod = require.cache[mod]) !== undefined) {
    // Recursively go over the results
    ;(function traverse(mod) {
      // Go over each of the module's children and
      // traverse them
      mod.children.forEach(function(child) {
        traverse(child)
      })

      // Call the specified callback providing the
      // found cached module
      callback(mod)
    })(mod)
  }
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
  const {
    webpackConfig: webpackClientConfig,
    webpackCompiler: webpackClientCompiler
  } = compiler.client

  const serverFile = getServerFile(
    webpackConfig,
    compiler.getCompilation().serverStats,
    options
  )
  const serverFilePath = `${
    webpackConfig.output ? webpackConfig.output.path : ''
  }/${serverFile}`

  const serverFS = webpackCompiler.outputFileSystem
  const clientFS = webpackClientCompiler.outputFileSystem

  ufs
    .use(serverFS)
    .use(clientFS)
    .use(ofs)
  patchFs(ufs)
  patchRequire(ufs)

  try {
    const fileExists = ((webpackCompiler.outputFileSystem as unknown) as IFs).existsSync(
      serverFilePath
    )

    if (fileExists) {
      const serverBundle = require(serverFilePath)

      return {
        bundle: require(serverFilePath),
        purge: () => purgeCache(serverFilePath)
      }
    }
  } catch (e) {
    console.log(e)
  }



  // return new Promise((res, rej) => {
    

  //   if (fileExists) {
  //     ;((webpackCompiler.outputFileSystem as unknown) as IFs).readFile(
  //       serverFilePath,
  //       (err, buffer) => {
  //         if (err) {
  //           rej(err)
  //         } else if (buffer) {
  //           if (require.cache[serverFilePath]) {
  //             purgeCache(serverFilePath)

  //             compiler.emit('invalidate-require')
  //           }
  //         }
  //       }
  //     )
  //   }
  // })
  //   .then(() => require(serverFilePath))
  //   .catch(err => {
  //     err.detail =
  //       'The error above was thrown while trying to load the built server file:\n'
  //     err.detail += 'The PATH: ' + serverFilePath
  //     throw err
  //   })
}

export function resolveCompilation(
  compiler: ClientServerCompiler,
  options?: MiddlewareOptions
) {
  let promise: any

  return () =>
    compiler
      .resolve()
      .then(compilation => {
        return loadExports(compiler, options)
        // if (promise && promise.compilation === compilation) {
        //   return promise
        // }

        // promise = pProps({
        //   // @ts-ignore
        //   compilation,
        //   bundle: loadExports(compiler, options)
        // })
        // promise.compilation = compilation

        // return promise
      })
      .catch(e => console.log(e))
}
