import { Compiler, Stats } from 'webpack'

export interface MiddlewareOptions {
  inMemoryFilesystem?: boolean
  watchDelay?: number
  watchOptions?: Compiler.WatchOptions
  report?: {
    stats?: string
  }
  notify?: boolean
  headers?: {
    [x: string]: string
  }
  findServerAssetName?: (stats: Stats.ToJsonOutput) => boolean
}
