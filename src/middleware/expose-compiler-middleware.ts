import { Request, Response, NextFunction } from "express"

import { UniversalCompiler } from "../types/compiler"
import { MiddlewareOptions } from "../types/middleware"

export const exposeCompilerMiddleware = (
  compiler: UniversalCompiler,
  _options: MiddlewareOptions
) => {
  return (res: Response, _req: Request, _next: NextFunction) => {
    res.locals.compiler = compiler
  }
}
