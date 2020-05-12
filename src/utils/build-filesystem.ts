/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Volume, createFsFromVolume } from "memfs"
import { CompilerStub } from "../types/compiler"
// JOIN should be deprecated!! Does not exist in fs. This
// is webpack team issue.
import join from "memory-fs/lib/join"

export function buildInMemoryFileSystem(
  client: CompilerStub,
  server: CompilerStub
) {
  const clientVolume = new Volume()
  const serverVolume = new Volume()
  const fs1 = createFsFromVolume(clientVolume)
  const fs2 = createFsFromVolume(serverVolume)
  const newClientFilesystem = {
    ...fs1,
    ...clientVolume,
    join,
  }

  const newServerFilesystem = {
    ...fs2,
    ...serverVolume,
    join,
  }

  /**
   * We supplement our own in-memory filesystem methods so we don't
   * need all existing methods.
   */
  // @ts-ignore
  client.webpackCompiler.outputFileSystem = newClientFilesystem
  // @ts-ignore
  server.webpackCompiler.outputFileSystem = newServerFilesystem
}
