import * as fs from 'fs'
import { join } from 'path'
import mkdirp from 'mkdirp'

export const nodeFs = () => ({
  ...fs,
  mkdirp,
  join
})
