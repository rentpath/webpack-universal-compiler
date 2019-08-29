import { Compiler, MultiCompiler, Configuration } from 'webpack'
import { MiddlewareOptions } from './middleware'

/// <reference types="webpack" />

export function isMultiCompiler(compiler?: any): compiler is MultiCompiler {
  if (
    compiler &&
    typeof (compiler as MultiCompiler).compilers !== 'undefined'
  ) {
    return true
  }
  return false
}

export function isMultiConfig(config?: any): config is Configuration[] {
  if (
    Array.isArray(config) &&
    (typeof config[0].run === 'undefined' ||
      typeof config[1].run === 'undefined')
  ) {
    return true
  }

  return false
}

export function isSingleCompiler(compiler?: any): compiler is Compiler {
  if (compiler && typeof (compiler as Compiler).run !== 'undefined') {
    return true
  }

  return false
}

export function isMiddlewareOptions(config?: any): config is MiddlewareOptions {
  const allOptions = [
    'inMemoryFilesystem',
    'watchDelay',
    'watchOptions',
    'report',
    'notify',
    'headers',
    'findServerAssetName'
  ]

  if (!config) {
    return false
  }

  if (config && !config.run) {
    if (allOptions.some(key => Object.keys(config).includes(key))) {
      return true
    }
    return true
  }

  return false
}

export function isSingleConfiguration(config?: any): config is Configuration {
  if (config && !config.run) {
    return true
  }

  return false
}

export function isClientSingleCompiler(
  compiler: Compiler
): compiler is Compiler {
  if (compiler.name === 'client') {
    return true
  } else if (
    compiler.options.target === 'web' ||
    compiler.options.target === 'webworker'
  ) {
    return true
  }

  return false
}

export function isServerSingleCompiler(
  compiler: Compiler
): compiler is Compiler {
  if (compiler.name === 'server') {
    return true
  } else if (
    compiler.options.target === 'node-webkit' ||
    compiler.options.target === 'node' ||
    compiler.options.target === 'async-node' ||
    compiler.options.target === 'electron' ||
    compiler.options.target === 'atom' ||
    compiler.options.target === 'electron-main' ||
    compiler.options.target === 'electron-renderer'
  ) {
    return true
  }

  return false
}

export function isClientConfiguration(
  config: Configuration
): config is Configuration {
  if (config && config.name === 'client') {
    return true
  } else if (config.target === 'web' || config.target === 'webworker') {
    return true
  }

  return false
}

export function isServerConfiguration(
  config: Configuration
): config is Configuration {
  if (config.name === 'server') {
    return true
  } else if (
    config.target === 'node-webkit' ||
    config.target === 'node' ||
    config.target === 'async-node' ||
    config.target === 'electron' ||
    config.target === 'atom' ||
    config.target === 'electron-main' ||
    config.target === 'electron-renderer'
  ) {
    return true
  }

  return false
}
