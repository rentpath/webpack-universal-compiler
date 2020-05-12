import webpack from "webpack"
import { simpleCompiler } from "../webpack/compiler"
import { universalCompiler } from "../webpack-universal/universal-compiler"

/// <reference types="node" />
/// <reference types="webpack" />

export interface ReporterOptions {
  stats?: boolean | "once" | undefined
  write?: (str: string) => any
  printStart?: () => string
  printSuccess?: ({ duration }: { duration?: number }) => string
  printFailure?: (err?: string) => string
  printInvalidate?: () => string
  printError?: (err: any) => string
}

export interface CompilationStats {
  duration: number
  stats: webpack.Stats
  clientStats: webpack.Stats
  serverStats: webpack.Stats
}

export interface ReporterOptionsSingleCompiler extends ReporterOptions {
  printStats?: ({ stats }: CompilationStats) => string
}

export interface ReporterOptionsIsomorphicCompiler
  extends ReporterOptionsSingleCompiler {
  printStats?: ({
    clientStats,
    serverStats,
  }: {
    clientStats: webpack.Stats
    serverStats: webpack.Stats
  }) => string
}

export interface ObserveWebpackCompilerState {
  isCompiling: boolean
  error: null | ErrWithStats
  compilation: {
    duration?: number
    stats?: webpack.Stats
  }
  webpackWatching?: null | webpack.Compiler.Watching
}

export interface ObserveWebpackIsoCompilerState
  extends ObserveWebpackCompilerState {
  beginAt: null | ReturnType<typeof Date.now>
  eitherError?: ErrWithStats
  compilation: {
    duration?: number
    clientStats?: webpack.Stats
    serverStats?: webpack.Stats
  }
  lastStats: {
    clientStats?: webpack.Stats
    serverStats?: webpack.Stats
  }
}

export interface CompilerStub {
  webpackCompiler: webpack.Compiler
  webpackConfig: webpack.Configuration
}

export interface ErrWithStats extends NodeJS.ErrnoException {
  stats: webpack.Stats
  detail?: string
}

export type SimpleCompiler = ReturnType<typeof simpleCompiler>
export type UniversalCompiler = ReturnType<typeof universalCompiler>
