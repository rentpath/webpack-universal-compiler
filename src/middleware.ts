import chalk from 'chalk'
import { Compiler, MultiCompiler, Configuration } from 'webpack'
import { clientServerCompiler } from './webpack-isomorphic/simple-isomorphic-compiler'
import { simpleWebpackCompiler } from './webpack/simple-compiler'
import { MiddlewareOptions } from './types/middleware'
import {
  isMiddlewareOptions,
  isMultiCompiler,
  isSingleCompiler,
  isMultiConfig,
  isSingleConfiguration
} from './types/type-guards'

function parseOptions(options: MiddlewareOptions) {
  options = {
    inMemoryFilesystem: true,
    watchDelay: 0,
    watchOptions: undefined,
    report: { stats: 'once' },
    notify: true,
    headers: { 'Cache-Control': 'max-age=0, must-revalidate' },
    ...options
  }

  return options
}

function parseArgs(
  args: [
    (MultiCompiler | Compiler | Configuration | [Configuration, Configuration]),
    (Configuration | Compiler | MiddlewareOptions)?,
    MiddlewareOptions?
  ]
) {
  const [argOne, argTwo, argThree] = args

  if (isMultiCompiler(argOne) && isMiddlewareOptions(argTwo)) {
    return {
      compiler: clientServerCompiler(argOne.compilers[0], argOne.compilers[1]),
      options: parseOptions(argTwo)
    }
  }

  if (isMultiConfig(argOne) && isMiddlewareOptions(argTwo)) {
    return {
      compiler: clientServerCompiler(argOne[0], argOne[1]),
      options: parseOptions(argTwo)
    }
  }

  if (
    isSingleConfiguration(argOne) &&
    isSingleConfiguration(argTwo) &&
    isMiddlewareOptions(argThree)
  ) {
    return {
      compiler: clientServerCompiler(argOne, argTwo),
      options: parseOptions(argThree)
    }
  }

  if (
    isSingleCompiler(argOne) &&
    isSingleCompiler(argTwo) &&
    isMiddlewareOptions(argThree)
  ) {
    return {
      compiler: clientServerCompiler(argOne, argTwo),
      options: parseOptions(argThree)
    }
  }

  if (
    (isSingleConfiguration(argOne) || isSingleCompiler(argOne)) &&
    isMiddlewareOptions(argTwo)
  ) {
    console.log(
      chalk.red.bold(
        'You passed in only a single Compiler or Configuration, you must pass both a Server and Client\n\n' +
          'const configs = [Client, Server]\n\n'
      )
    )
  }

  throw new TypeError('Config Error')
}

function webpackClientServerMiddleware(
  ...args: [
    (MultiCompiler | Compiler | Configuration | [Configuration, Configuration]),
    (Configuration | Compiler | MiddlewareOptions)?,
    MiddlewareOptions?
  ]
) {
  const { compiler, options } = parseArgs(args)
}

export { clientServerCompiler, webpackClientServerMiddleware, simpleWebpackCompiler }
