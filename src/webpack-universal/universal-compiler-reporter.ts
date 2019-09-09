import chalk from "chalk"
import indentString from "indent-string"

import renderers from "../helpers/renderers"
import symbols from "../helpers/symbols"
import { startReportingWebpack } from "../webpack/compiler-reporter"

import { ReporterOptionsIsomorphicCompiler } from "../types/compiler"

export const extraSymbols = {
  ...symbols,
  separator: process.platform !== "win32" ? "━" : "-"
}

export const extraRenderers = {
  ...renderers,
  banner: (label: string) => {
    let str: string

    str = `${chalk.inverse(` ${label} ${" ".repeat(35 - label.length - 1)}`)}\n`
    str += chalk.dim(extraSymbols.separator.repeat(35))

    return str
  }
}

export function startReportingWebpackIsomorphic(
  compiler: any,
  options: ReporterOptionsIsomorphicCompiler
) {
  options = {
    printStats: ({ clientStats, serverStats }) => {
      let str = ""

      str += `\n${extraRenderers.banner("CLIENT")}\n`
      str += `${extraRenderers.stats(clientStats)}\n`

      str += `\n${extraRenderers.banner("SERVER")}\n`
      str += `${extraRenderers.stats(serverStats)}\n\n`

      return indentString(str, 4)
    },
    ...options
  } as ReporterOptionsIsomorphicCompiler

  return startReportingWebpack(compiler, options)
}
