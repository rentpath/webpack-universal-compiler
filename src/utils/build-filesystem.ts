import * as fs from 'fs'
import { Volume } from 'memfs'
import { Union } from 'unionfs'
import { patchRequire } from 'fs-monkey'
import { CompilerStub } from '../types/compiler'

export function buildInMemoryFileSystem(
  client: CompilerStub,
  server: CompilerStub
) {
  const ufs = new Union()

  client.webpackCompiler.outputFileSystem = {
    ...client.webpackCompiler.outputFileSystem,
    ...new Volume()
  }

  server.webpackCompiler.outputFileSystem = {
    ...server.webpackCompiler.outputFileSystem,
    ...new Volume()
  }

  ufs
    .use(client.webpackCompiler.outputFileSystem)
    .use(server.webpackCompiler.outputFileSystem)
    .use(fs)

  patchRequire(ufs)
}
