import * as fs from 'fs'
import { Volume, createFsFromVolume } from 'memfs'
import { Union } from 'unionfs'
import { patchRequire } from 'fs-monkey'
import { CompilerStub } from '../types/compiler'

export function buildInMemoryFileSystem(
  client: CompilerStub,
  server: CompilerStub
) {
  const ufs = new Union()

  const newClientFilesystem = {
    ...client.webpackCompiler.outputFileSystem,
    ...createFsFromVolume(new Volume())
  }

  const newServerFilesystem = {
    ...server.webpackCompiler.outputFileSystem,
    ...createFsFromVolume(new Volume())
  }

  client.webpackCompiler.outputFileSystem = newClientFilesystem
  server.webpackCompiler.outputFileSystem = newServerFilesystem

  ufs
    .use(client.webpackCompiler.outputFileSystem)
    .use(server.webpackCompiler.outputFileSystem)
    .use(fs)

  patchRequire(ufs)
}
