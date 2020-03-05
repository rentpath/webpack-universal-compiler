import chalk from "chalk"
import { Compiler, MultiCompiler, Configuration } from "webpack"
import webpackHotMiddleware from "webpack-hot-middleware"
import { compose } from "compose-middleware"
import { compilationMiddleware } from "./middleware/compilation-middleware"
import { devMiddleware } from "./middleware/dev-middleware"
import { reportErrorMiddleware } from "./middleware/report-error-middleware"
import { universalCompiler } from "./webpack-universal/universal-compiler"
import { startReportingWebpackIsomorphic } from "./webpack-universal/universal-compiler-reporter"
import { startNotifying } from "./utils/os-notifications"
import { checkHashes } from "./utils/check-hashes"
import { MiddlewareOptions } from "./types/middleware"
import {
  isMiddlewareOptions,
  isMultiCompiler,
  isSingleCompiler,
  isMultiConfig,
  isSingleConfiguration
} from "./types/type-guards"
import { NotifierOptions } from "./utils/os-notifications"

function parseOptions(options: MiddlewareOptions) {
  options = {
    inMemoryFilesystem: true,
    watchDelay: 0,
    hot: false,
    watchOptions: undefined,
    report: { stats: "once" },
    notify: true,
    headers: { "Cache-Control": "max-age=0, must-revalidate" },
    ...options
  }

  options.report = options.report === true ? {} : options.report
  options.notify = options.notify === true ? {} : options.notify

  return options
}

function parseArgs(
  args: [
    MultiCompiler | Compiler | Configuration | [Configuration, Configuration],
    (Configuration | Compiler | MiddlewareOptions)?,
    MiddlewareOptions?
  ]
) {
  const [argOne, argTwo, argThree] = args

  if (isMultiCompiler(argOne) && isMiddlewareOptions(argTwo)) {
    return {
      compiler: universalCompiler(argOne.compilers[0], argOne.compilers[1]),
      options: parseOptions(argTwo)
    }
  }

  if (isMultiConfig(argOne) && isMiddlewareOptions(argTwo)) {
    return {
      compiler: universalCompiler(argOne[0], argOne[1]),
      options: parseOptions(argTwo)
    }
  }

  if (
    isSingleConfiguration(argOne) &&
    isSingleConfiguration(argTwo) &&
    isMiddlewareOptions(argThree)
  ) {
    return {
      compiler: universalCompiler(argOne, argTwo),
      options: parseOptions(argThree)
    }
  }

  if (
    isSingleCompiler(argOne) &&
    isSingleCompiler(argTwo) &&
    isMiddlewareOptions(argThree)
  ) {
    return {
      compiler: universalCompiler(argOne, argTwo),
      options: parseOptions(argThree)
    }
  }

  if (
    (isSingleConfiguration(argOne) || isSingleCompiler(argOne)) &&
    isMiddlewareOptions(argTwo)
  ) {
    console.log(
      chalk.red.bold(
        "You passed in only a single Compiler or Configuration, you must pass both a Server and Client\n\n" +
          "const configs = [Client, Server]\n\n"
      )
    )
  }

  throw new TypeError("Config Error")
}

export function universalMiddleware(
  ...args: [
    MultiCompiler | Compiler | Configuration | [Configuration, Configuration],
    (Configuration | Compiler | MiddlewareOptions)?,
    MiddlewareOptions?
  ]
) {
  const { compiler, options } = parseArgs(args)

  if (options.inMemoryFilesystem) {
    require("./utils/build-filesystem").buildInMemoryFileSystem(
      compiler.client,
      compiler.server
    )
  }

  if (typeof options.report !== "undefined" && options.report !== false) {
    options.report = startReportingWebpackIsomorphic(
      compiler,
      options.report
    ).options
  }

  if (options.notify && options.notify !== false) {
    options.notify = startNotifying(
      compiler,
      options.notify as NotifierOptions
    ).options
  }

  options.inMemoryFilesystem && checkHashes(compiler, options)

  const middleware = [
    compilationMiddleware(compiler, options),
    devMiddleware(compiler, options),
    reportErrorMiddleware(compiler, options)
  ]

  if (options.hot) {
    middleware.push(webpackHotMiddleware(compiler.client.webpackCompiler))
  }

  compiler.watch()

  return Object.assign(compose(middleware), {
    compiler
  })
}
