import chalk from "chalk"

import {
  UniversalCompiler,
  ReporterOptionsIsomorphicCompiler,
  CompilationStats
} from "../types/compiler"

interface Reporter {
  report?: ReporterOptionsIsomorphicCompiler
}

const configProperties = [
  "output.filename",
  "output.chunkFilename",
  "output.hotUpdateMainFilename",
  "output.hotUpdateChunkFilename"
]

function verifyAssets(compilation: CompilationStats, options: Reporter) {
  const write =
    options.report && options.report.write
      ? options.report.write
      : (msg: string) => process.stderr.write(msg)

  const { types, assets } = ["client", "server"].reduce(
    (detected, type) => {
      const statsJson = compilation[
        `${type}Stats` as "clientStats" | "serverStats"
      ].toJson({
        assets: true,
        chunks: false,
        version: false,
        children: false,
        modules: false,
        timings: false,
        hash: false
      })

      const assetsWithHash =
        statsJson.assets &&
        statsJson.assets.filter(({ name }) =>
          /(^|[^0-9a-z])(?=[a-z]*\d)(?=\d*[a-z])[0-9a-z]{10,}[^0-9a-z]/i.test(
            name
          )
        )

      if (assetsWithHash && assetsWithHash.length) {
        detected.assets.push(...assetsWithHash)
        detected.types.push(type)
      }

      return detected
    },
    { assets: [] as any[], types: [] as any[] }
  )

  if (!assets.length) {
    return false
  }

  let str: string

  str = `${chalk.yellow(
    "WARN"
  )}: Assets with a hash in its name were detected on the `
  str += `${types.map(type => chalk.bold(type)).join(" and ")}:\n`

  assets.forEach(asset => {
    str += `- ${asset.name}\n`
  })

  str += `
This is known to cause ${chalk.bold("memory leaks")} with ${chalk.bold(
    "webpack-dev-middleware's"
  )} in-memory filesystem.
You should avoid using ${chalk.bold("[hash]")} in ${configProperties.join(
    ", "
  )} as well as similar options in loaders & plugins.
Alternatively, you may set \`inMemoryFilesystem\` to false altough it will still create many files in the output folder.
If you feel this was a false positive, please ignore this warning.
`

  write(str)

  return true
}

export function checkHashes(compiler: UniversalCompiler, options: Reporter) {
  compiler.once("end", (compilation: CompilationStats) => {
    if (!verifyAssets(compilation, options)) {
      compiler.once("end", compilation => verifyAssets(compilation, options))
    }
  })
}
