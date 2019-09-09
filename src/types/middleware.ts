import { Compiler, Stats } from "webpack"
import { NotifierOptions } from "../utils/os-notifications"
import { ReporterOptions } from "./compiler"

/// <reference types="webpack" />

export interface MiddlewareOptions {
  inMemoryFilesystem?: boolean
  watchDelay?: number
  watchOptions?: Compiler.WatchOptions
  report?: ReporterOptions
  hot?: boolean
  notify?: boolean | NotifierOptions
  headers?: {
    [x: string]: string
  }
  findServerAssetName?: (stats: Stats.ToJsonOutput) => boolean
}
