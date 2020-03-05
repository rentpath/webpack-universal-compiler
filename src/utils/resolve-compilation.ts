/* eslint-disable @typescript-eslint/ban-ts-ignore */
import * as fs from "fs"
import { resolve, dirname } from "path"
import decache from "decache"
import { Stats } from "webpack"
import { IFs } from "memfs"
import callsite from "callsite"
import { patchRequire, patchFs } from "../../external/fs-monkey"
import { ufs } from "unionfs"

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

function loadMemoryExports(
  compiler: UniversalCompiler,
  options: MiddlewareOptions
) {
  const { webpackConfig, webpackCompiler } = compiler.server
  const { webpackCompiler: webpackClientCompiler } = compiler.client

  const serverFile = getServerFile(
    webpackConfig,
    options,
    compiler.getCompilation().serverStats
  )

  if (!serverFile) {
    throw Error("No server file, maybe it didn't compile?")
  }

  const serverFilePath = `${
    webpackConfig.output ? webpackConfig.output.path : ""
  }/${serverFile}`

  const serverFS = webpackCompiler.outputFileSystem
  const clientFS = webpackClientCompiler.outputFileSystem

  ufs
    .use(serverFS)
    .use(clientFS)
    .use(fs)
  patchFs(ufs)
  patchRequire(ufs)

  try {
    const fileExists = ((webpackCompiler.outputFileSystem as unknown) as IFs).existsSync(
      serverFilePath
    )
    const foundStack = requireFind(serverFilePath)

    if (foundStack && requireState.loaded) {
      decache(serverFilePath)

      requireState.loaded = false
    }

    if (fileExists) {
      requireState.loaded = true

      return require(serverFilePath)
    }
  } catch (err) {
    err.detail =
      "The error above was thrown while trying to load the built server file from memory:\n"
    err.detail += "The PATH: " + serverFilePath
    throw err
  }
}

export function resolveCompilation(
  compiler: UniversalCompiler,
  options: MiddlewareOptions
) {
  return () =>
    compiler
      .resolve()
      .then(compilation => {
        return {
          compilation,
          bundle: loadMemoryExports(compiler, options)
        }
      })
      .catch(e => {
        throw e
      })
}
