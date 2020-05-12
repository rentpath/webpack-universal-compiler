import fs from "fs"
import chalk from "chalk"
import { Request, Response, NextFunction } from "express"
import { resolveCompilation } from "../utils/resolve-compilation"

import { UniversalCompiler } from "../types/compiler"
import { MiddlewareOptions } from "../types/middleware"
import { patchRequire, patchFs } from "../../external/fs-monkey"
import { ufs } from "unionfs"

const ofs = {
  ...fs,
}

export function compilationMiddleware(
  compiler: UniversalCompiler,
  options: MiddlewareOptions
) {
  const resolvedCompile = resolveCompilation(compiler, options)

  if (options.inMemoryFilesystem) {
    console.log(
      chalk.yellow.bold(
        `${chalk.white.bold(
          "\nWarning: "
        )}You're using an in-memory filesystem. If you experience node crashes (GC), please set 'inMemoryFilesystem' to "false"\n`
      )
    )

    ufs
      .use(compiler.server.webpackCompiler.outputFileSystem)
      .use(compiler.client.webpackCompiler.outputFileSystem)
      .use(ofs)
    patchFs(ufs)
    patchRequire(ufs)

    console.log(
      chalk.white.bold(
        `${chalk.green.bold(
          "Success:\n\n"
        )}- Patched require()\n- Patched node Fs\n\n` +
          "Your require() and Fs are now patched into the in-memory filesystem.\n" +
          "You may have warnings about es6 or commonJS imports. Make sure those imports are compiled\n" +
          "and run before the middleware is called in Express.use().\n"
      )
    )
  }

  return (_req: Request, res: Response, next: NextFunction) => {
    if (compiler.isCompiling()) {
      console.warn("Webpack is still compiling...come back later...")

      next()
    } else {
      resolvedCompile()
        .then((compilation) => {
          if (compilation && compilation.bundle) {
            res.locals.universal = compilation
          }
        })
        .then(next, next)
        .catch((e) => {
          throw e
        })
    }
  }
}
