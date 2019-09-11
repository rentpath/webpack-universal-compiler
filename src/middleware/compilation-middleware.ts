import { Request, Response, NextFunction } from "express"
import { resolveCompilation } from "../utils/resolve-compilation"

import { UniversalCompiler } from "../types/compiler"
import { MiddlewareOptions } from "../types/middleware"

export function compilationMiddleware(
  compiler: UniversalCompiler,
  options: MiddlewareOptions
) {
  const resolvedCompile = resolveCompilation(compiler, options)

  return (_req: Request, res: Response, next: NextFunction) => {
    resolvedCompile()
      .then(compilation => {
        if (compilation && compilation.bundle) {
          res.locals.universal = compilation
        }
      })
      .then(next, next)
      .catch(e => {
        throw e
      })
  }
}
