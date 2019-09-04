import { Compiler, Configuration } from "webpack"
import chalk from "chalk"
import {
  isMultiCompiler,
  isMultiConfig,
  isServerSingleCompiler,
  isSingleCompiler,
  isClientSingleCompiler,
  isSingleConfiguration,
  isClientConfiguration,
  isServerConfiguration
} from "../types/type-guards"

function checkForSingleCompiler(
  client: Compiler | Configuration,
  server: Compiler | Configuration
) {
  if (isSingleCompiler(client) && !isClientSingleCompiler(client)) {
    console.log(
      chalk.yellow.bold(
        `${chalk.white.bold(
          "Warning: "
        )}After scanning your Webpack Compiler instance, the first param doesn't appear to be a client Compiler instance.`,
        "The order of Compilers should be [client, server]...proceeding anyway\n"
      )
    )
  }

  if (isSingleCompiler(server) && !isServerSingleCompiler(server)) {
    console.log(
      chalk.yellow.bold(
        `${chalk.white.bold(
          "Warning: "
        )}After scanning your Webpack Compiler instance, the second param doesn't appear to be a server Compiler instance.`,
        "The order of Compilers should be [client, server]...proceeding anyway\n"
      )
    )
  }
}

function checkForSingleConfiguration(
  client: Compiler | Configuration,
  server: Compiler | Configuration
) {
  if (isSingleConfiguration(client) && !isClientConfiguration(client)) {
    console.log(
      chalk.yellow.bold(
        `${chalk.white.bold(
          "Warning: "
        )}After scanning your Webpack Configuration, the first param doesn't appear to be a client Configuration`,
        "The order of Configurations should be [client, server]...proceeding anyway\n"
      )
    )
  }

  if (isSingleConfiguration(server) && !isServerConfiguration(server)) {
    console.log(
      chalk.yellow.bold(
        `${chalk.white.bold(
          "Warning: "
        )}After scanning your Webpack Configuration, the second param doesn't appear to be a server Configuration`,
        "The order of Configurations should be [client, server]...proceeding anyway\n"
      )
    )
  }
}

export function webpackConfigValidator(
  client: Compiler | Configuration,
  server: Compiler | Configuration
) {
  if (isMultiCompiler(client) || isMultiCompiler(server)) {
    console.log(
      chalk.red.bold(
        "You passed in a MultiCompiler instance, please pass one Compiler or Webpack Configuration at a time!"
      )
    )

    return false
  }

  if (isMultiConfig(client) || isMultiConfig(server)) {
    return console.log(
      chalk.red.bold(
        "You passed in an array of Webpack Configurations, please pass one Compiler or Webpack Configuration at a time!"
      )
    )

    return false
  }

  checkForSingleCompiler(client, server)
  checkForSingleConfiguration(client, server)

  return true
}
