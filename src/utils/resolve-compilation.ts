/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { resolve, dirname } from "path"
import decache from "decache"
import { Stats } from "webpack"
import { IFs } from "memfs"
import callsite from "callsite"
// @ts-ignore
import { requireFromString } from "require-from-memory"

import { pProps } from "../utils/p-utils"

import { UniversalCompiler } from "../types/compiler"
import { MiddlewareOptions } from "../types/middleware"

const requireState = {
  loaded: false
}

const getServerAsset = (stats: Stats.ToJsonOutput) => {
  if (stats.entrypoints) {
    const entrypoint = Object.keys(stats.entrypoints)[0]

    if (stats.assetsByChunkName) {
      let serverFileName
      if (Array.isArray(stats.assetsByChunkName[entrypoint])) {
        const serverEntryAsArray = (stats.assetsByChunkName[
          entrypoint
        ] as unknown) as string[]
        serverFileName = serverEntryAsArray.find(asset => /\.js$/.test(asset))
      } else {
        serverFileName = [stats.assetsByChunkName[entrypoint]].find(asset =>
          /\.js$/.test((asset as unknown) as string)
        )
      }

      if (serverFileName) {
        return serverFileName
      }

      throw Object.assign(new Error("Seems that there is no server file!"), {
        hideStack: true
      })
    }

    throw Object.assign(new Error("Seems that there are no assets?"), {
      hideStack: true
    })
  }

  throw Object.assign(new Error("No entrypoint in stats!"), {
    hideStack: true
  })
}

function getServerFile(
  _webpackConfig: UniversalCompiler["server"]["webpackConfig"],
  _options: MiddlewareOptions,
  stats?: Stats
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

  throw Object.assign(new Error("Coudldn't find server entry JS file!"), {
    hideStack: true
  })
}

function requireFind(moduleName: string) {
  if (moduleName[0] === ".") {
    const stack = callsite()
    for (const i in stack) {
      const filename = stack[i].getFileName()
      if (filename !== module.filename) {
        moduleName = resolve(dirname(filename), moduleName)
        break
      }
    }
  }
  try {
    return require.resolve(moduleName)
  } catch (e) {
    return
  }
}

function loadExports(compiler: UniversalCompiler, options: MiddlewareOptions) {
  const { webpackConfig, webpackCompiler } = compiler.server

  const serverFile = getServerFile(
    webpackConfig,
    options,
    compiler.getCompilation().serverStats
  )

  if (!serverFile) {
    return Promise.resolve(undefined)
  }

  const serverFilePath = `${
    webpackConfig.output ? webpackConfig.output.path : ""
  }/${serverFile}`

  return new Promise((res, rej) => {
    const fileExists = ((webpackCompiler.outputFileSystem as unknown) as IFs).existsSync(
      serverFilePath
    )

    if (fileExists) {
      res(serverFilePath)
    } else {
      rej("No server file found!")
    }
  })
    .then((source: string) => {
      const foundStack = requireFind(source)

      if (foundStack && requireState.loaded) {
        decache(serverFilePath)

        requireState.loaded = false
      }

      return require(serverFilePath)
    })
    .catch(err => {
      err.detail =
        "The error above was thrown while trying to load the built server file:\n"
      err.detail += "The PATH: " + serverFilePath
      throw err
    })
}

// function loadMemoryExports(
//   compiler: UniversalCompiler,
//   options: MiddlewareOptions
// ) {
//   const { webpackConfig, webpackCompiler } = compiler.server

//   const serverFile = getServerFile(
//     webpackConfig,
//     options,
//     compiler.getCompilation().serverStats
//   )

//   if (!serverFile) {
//     throw Error("No server file, maybe it didn't compile?")
//   }

//   const serverFilePath = `${
//     webpackConfig.output ? webpackConfig.output.path : ""
//   }/${serverFile}`

//   return new Promise((res, rej) => {
//     const fileExists = ((webpackCompiler.outputFileSystem as unknown) as IFs).existsSync(
//       serverFilePath
//     )

//     if (fileExists) {
//       res(serverFilePath)
//     } else {
//       rej("No File")
//     }
//   })
//     .then((source: string) => {
//       decache(source)

//       return require(source)
//     })
//     .catch(err => {
//       err.detail =
//         "The error above was thrown while trying to load the built server file:\n"
//       err.detail += "The PATH: " + serverFilePath
//       throw err
//     })
// }

export function resolveCompilation(
  compiler: UniversalCompiler,
  options: MiddlewareOptions
) {
  let previousHash: string | undefined
  let promise: any

  return () =>
    compiler
      .resolve()
      .then(compilation => {
        if (compilation.serverStats?.hash === previousHash && promise) {
          return promise
        }

        previousHash = compilation.serverStats?.hash

        promise = pProps({
          // @ts-ignore
          compilation,
          bundle: loadExports(compiler, options)
        })

        requireState.loaded = true

        return promise
      })
      .catch(e => {
        throw e
      })
}
