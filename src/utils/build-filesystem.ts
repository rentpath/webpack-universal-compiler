import fs from 'fs'
import { Volume, createFsFromVolume } from 'memfs'
import { CompilerStub } from '../types/compiler'

const ofs = {
  ...fs
}

export function buildInMemoryFileSystem(
  client: CompilerStub,
  server: CompilerStub
) {
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
}
