import indentString from 'indent-string'
import { pFinally } from '../helpers/p-utils'
import { wrap } from '../helpers/wrap'

import renderers from '../helpers/renderers'

import {
  SimpleCompiler,
  CompilationStats,
  ReporterOptionsSingleCompiler
} from '../types/compiler'

export function startReportingWebpack(
  compiler: SimpleCompiler,
  options: ReporterOptionsSingleCompiler
) {
  let displayStats: any

  options = {
    stats: true,
    write: (str: string) => str && process.stderr.write(str),
    printStart: () => `${renderers.start()}\n`,
    printSuccess: ({ duration }) => `${renderers.success(duration)}\n`,
    printFailure: () => `${renderers.failure()}\n`,
    printInvalidate: () => `${renderers.invalidate()}\n`,
    printStats: ({ stats }) =>
      `\n${indentString(renderers.stats(stats), 4)}\n\n`,
    printError: err => `\n${indentString(renderers.error(err), 4)}\n\n`,
    ...options
  }

  const resetDisplayStats = () => {
    if (options.stats === true || options.stats === 'once') {
      displayStats = true
    }
  }
  const didPrintStats = () =>
    (displayStats = options.stats === 'once' ? false : displayStats)
  const write = (str: string) => options.write && options.write(str)

  const onBegin = () => write(options.printStart())

  const onEnd = (compilation: CompilationStats) => {
    if (compilation.duration) {
      write(options.printSuccess(compilation))
    }

    if (displayStats) {
      write(options.printStats(compilation))

      didPrintStats()
    }
  }

  const onError = (err?: string) => {
    write(options.printFailure(err))
    write(options.printError(err))
  }

  const onInvalidate = () => write(options.printInvalidate())

  const stopReporting = () => {
    compiler
      .removeListener('begin', onBegin)
      .removeListener('end', onEnd)
      .removeListener('error', onError)
      .removeListener('invalidate', onInvalidate)
  }

  resetDisplayStats()
  ;['run', 'unwatch'].forEach((method: 'run' | 'unwatch') => {
    compiler[method] = wrap(compiler[method], (fn, ...args) =>
      pFinally(fn(...args), resetDisplayStats)
    )
  })

  compiler
    .on('begin', onBegin)
    .on('end', onEnd)
    .on('error', onError)
    .on('invalidate', onInvalidate)

  return {
    stop: stopReporting,
    options
  }
}
