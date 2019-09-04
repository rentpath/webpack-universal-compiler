import fs from 'fs'
import { Volume, createFsFromVolume } from 'memfs'
import { CompilerStub } from '../types/compiler'
import join from 'memory-fs/lib/join'

const ofs = {
  ...fs
}

export function buildInMemoryFileSystem(
  client: CompilerStub,
  server: CompilerStub
) {
  const vol1 = new Volume()
  const vol2 = new Volume()
  const fs1 = createFsFromVolume(vol1)
  const fs2 = createFsFromVolume(vol2)
  const newClientFilesystem = {
    ...fs1,
    ...vol1,
    join
  }

  const newServerFilesystem = {
    ...fs2,
    ...vol2,
    join
  }

  client.webpackCompiler.outputFileSystem = newClientFilesystem
  server.webpackCompiler.outputFileSystem = newServerFilesystem
}
