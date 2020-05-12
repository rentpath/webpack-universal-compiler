import webpack from "webpack"
import chalk from "chalk"
import PrettyError from "pretty-error"
import symbols from "./symbols"

import { ErrWithStats } from "../types/compiler"

const prettyError = new PrettyError()

prettyError.appendStyle({
  "pretty-error > header": { display: "none" },
  "pretty-error > trace": { marginTop: 0 },
  "pretty-error > trace > item": { marginBottom: 0 },
})

const defaultStatsOptions = {
  assets: true,
  children: false,
  chunks: false,
  colors: true,
  hash: false,
  modules: false,
  timings: false,
  version: false,
  builtAt: false,
  entrypoints: false,
}

const renderGenericError = (err: NodeJS.ErrnoException) => {
  let str = ""

  if (err.code || (err.name && err.name !== "Error")) {
    str += chalk.dim(`${err.code || err.name}: `)
  }

  str += `${err.message}\n`

  // Add the stack
  const prettyErrStr = prettyError
    .render(err)
    .trim()
    .split("\n")
    .slice(0, -1)
    .join("\n")

  str += `${prettyErrStr}`

  return str
}

const renderStart = () => `${chalk.dim(symbols.start)} Compiling...`

const renderSuccess = (duration?: number) => {
  let str = ""

  str += `${chalk.green(symbols.success)} Compilation succeeded`
  str += duration != null ? ` ${chalk.dim(`(${duration}ms)`)}` : ""

  return str
}

const renderFailure = () => `${chalk.red(symbols.failure)} Compilation failed`

const renderInvalidate = () =>
  `${chalk.cyan(symbols.invalidate)} Compilation invalidated`

const renderError = (err: ErrWithStats, statsOptions = defaultStatsOptions) => {
  let str = ""

  // If there's stats & compilation errors, then we just render them
  if (err.stats && err.stats.hasErrors && err.stats.hasErrors()) {
    str += `${err.message}\n\n`
    str += renderStats(err.stats, { ...statsOptions, assets: false })

    return str
  }

  return renderGenericError(err)
}

const renderStats = (
  stats: webpack.Stats,
  statsOptions = defaultStatsOptions
) => `${stats.toString(statsOptions).trim()}`

export default {
  start: renderStart,
  success: renderSuccess,
  failure: renderFailure,
  invalidate: renderInvalidate,
  error: renderError,
  stats: renderStats,
}
