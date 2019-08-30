import { Compiler, Stats } from 'webpack'
import { NotifierOptions } from '../utils/os-notifications'

/// <reference types="webpack" />

export interface MiddlewareOptions {
  inMemoryFilesystem?: boolean
  watchDelay?: number
  watchOptions?: Compiler.WatchOptions
  report?: {
    stats?: boolean | 'once'
  }
  hot?: boolean
  notify?: boolean | NotifierOptions
  headers?: {
    [x: string]: string
  }
  findServerAssetName?: (stats: Stats.ToJsonOutput) => boolean
}
