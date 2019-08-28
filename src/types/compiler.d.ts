import webpack from 'webpack'
import { simpleWebpackCompiler } from '../webpack/simple-compiler'

export interface ReporterOptions {
  stats: boolean | 'once'
  write: (str: string) => any
  printStart: () => string
  printSuccess: ({ duration }: { duration?: number }) => string
  printFailure: (err?: string) => string
  printInvalidate: () => string
  printError: (err: any) => string
}

export interface CompilationStats {
  duration: number
  stats: webpack.Stats
  clientStats: webpack.Stats
  serverStats: webpack.Stats
}

export interface ReporterOptionsSingleCompiler extends ReporterOptions {
  printStats: ({ stats }: CompilationStats) => string
}

export interface ReporterOptionsIsomorphicCompiler
  extends ReporterOptionsSingleCompiler {
  printStats: ({
    clientStats,
    serverStats
  }: {
    clientStats: webpack.Stats
    serverStats: webpack.Stats
  }) => string
}

export interface ObserveWebpackCompilerState {
  isCompiling: boolean
  error: null | Error
  compilation: {
    duration?: number | undefined
    stats?: webpack.Stats
  }
  webpackWatching?: null | webpack.Compiler.Watching
}

export interface ObserveWebpackIsoCompilerState
  extends ObserveWebpackCompilerState {
  beginAt: null | ReturnType<typeof Date.now>
}

export interface ErrStats extends NodeJS.ErrnoException {
  stats: webpack.Stats
}

export type SimpleCompiler = ReturnType<typeof simpleWebpackCompiler>
