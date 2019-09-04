import { Request, Response, NextFunction } from "express"
import { resolveCompilation } from "../utils/resolve-compilation"

import { ClientServerCompiler } from "../types/compiler"
import { MiddlewareOptions } from "../types/middleware"

export function compilationMiddleware(
  compiler: ClientServerCompiler,
  _options: MiddlewareOptions
) {
  const resolvedCompile = resolveCompilation(compiler, {})

  return (req: Request, res: Response, next: NextFunction) => {
    resolvedCompile()
      .then(compilation => {
        res.locals.universal = compilation
      })
      .then(next, next)
      .catch(e => console.log(e))
  }
}
