/// <reference types="node" />
import * as fs from 'fs';
import { join } from 'path';
import mkdirp from 'mkdirp';
export declare const nodeFs: () => {
    mkdirp: typeof mkdirp;
    join: typeof join;
    rename: typeof fs.rename;
    renameSync(oldPath: fs.PathLike, newPath: fs.PathLike): void;
    truncate: typeof fs.truncate;
    truncateSync(path: fs.PathLike, len?: number | null | undefined): void;
    ftruncate: typeof fs.ftruncate;
    ftruncateSync(fd: number, len?: number | null | undefined): void;
    chown: typeof fs.chown;
    chownSync(path: fs.PathLike, uid: number, gid: number): void;
    fchown: typeof fs.fchown;
    fchownSync(fd: number, uid: number, gid: number): void;
    lchown: typeof fs.lchown;
    lchownSync(path: fs.PathLike, uid: number, gid: number): void;
    chmod: typeof fs.chmod;
    chmodSync(path: fs.PathLike, mode: string | number): void;
    fchmod: typeof fs.fchmod;
    fchmodSync(fd: number, mode: string | number): void;
    lchmod: typeof fs.lchmod;
    lchmodSync(path: fs.PathLike, mode: string | number): void;
    stat: typeof fs.stat;
    statSync(path: fs.PathLike): fs.Stats;
    fstat: typeof fs.fstat;
    fstatSync(fd: number): fs.Stats;
    lstat: typeof fs.lstat;
    lstatSync(path: fs.PathLike): fs.Stats;
    link: typeof fs.link;
    linkSync(existingPath: fs.PathLike, newPath: fs.PathLike): void;
    symlink: typeof fs.symlink;
    symlinkSync(target: fs.PathLike, path: fs.PathLike, type?: "dir" | "file" | "junction" | null | undefined): void;
    readlink: typeof fs.readlink;
    readlinkSync(path: fs.PathLike, options?: {
        encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null | undefined;
    } | "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null | undefined): string;
    readlinkSync(path: fs.PathLike, options: {
        encoding: "buffer";
    } | "buffer"): Buffer;
    readlinkSync(path: fs.PathLike, options?: string | {
        encoding?: string | null | undefined;
    } | null | undefined): string | Buffer;
    realpath: typeof fs.realpath;
    realpathSync: typeof fs.realpathSync;
    unlink: typeof fs.unlink;
    unlinkSync(path: fs.PathLike): void;
    rmdir: typeof fs.rmdir;
    rmdirSync(path: fs.PathLike): void;
    mkdir: typeof fs.mkdir;
    mkdirSync(path: fs.PathLike, options?: string | number | fs.MakeDirectoryOptions | null | undefined): void;
    mkdtemp: typeof fs.mkdtemp;
    mkdtempSync(prefix: string, options?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | {
        encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null | undefined;
    } | null | undefined): string;
    mkdtempSync(prefix: string, options: "buffer" | {
        encoding: "buffer";
    }): Buffer;
    mkdtempSync(prefix: string, options?: string | {
        encoding?: string | null | undefined;
    } | null | undefined): string | Buffer;
    readdir: typeof fs.readdir;
    readdirSync(path: fs.PathLike, options?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | {
        encoding: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null;
        withFileTypes?: false | undefined;
    } | null | undefined): string[];
    readdirSync(path: fs.PathLike, options: "buffer" | {
        encoding: "buffer";
        withFileTypes?: false | undefined;
    }): Buffer[];
    readdirSync(path: fs.PathLike, options?: string | {
        encoding?: string | null | undefined;
        withFileTypes?: false | undefined;
    } | null | undefined): string[] | Buffer[];
    readdirSync(path: fs.PathLike, options: {
        encoding?: string | null | undefined;
        withFileTypes: true;
    }): fs.Dirent[];
    close: typeof fs.close;
    closeSync(fd: number): void;
    open: typeof fs.open;
    openSync(path: fs.PathLike, flags: string | number, mode?: string | number | null | undefined): number;
    utimes: typeof fs.utimes;
    utimesSync(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): void;
    futimes: typeof fs.futimes;
    futimesSync(fd: number, atime: string | number | Date, mtime: string | number | Date): void;
    fsync: typeof fs.fsync;
    fsyncSync(fd: number): void;
    write: typeof fs.write;
    writeSync(fd: number, buffer: fs.BinaryData, offset?: number | null | undefined, length?: number | null | undefined, position?: number | null | undefined): number;
    writeSync(fd: number, string: any, position?: number | null | undefined, encoding?: string | null | undefined): number;
    read: typeof fs.read;
    readSync(fd: number, buffer: fs.BinaryData, offset: number, length: number, position: number | null): number;
    readFile: typeof fs.readFile;
    readFileSync(path: string | number | Buffer | import("url").URL, options?: {
        encoding?: null | undefined;
        flag?: string | undefined;
    } | null | undefined): Buffer;
    readFileSync(path: string | number | Buffer | import("url").URL, options: string | {
        encoding: string;
        flag?: string | undefined;
    }): string;
    readFileSync(path: string | number | Buffer | import("url").URL, options?: string | {
        encoding?: string | null | undefined;
        flag?: string | undefined;
    } | null | undefined): string | Buffer;
    writeFile: typeof fs.writeFile;
    writeFileSync(path: string | number | Buffer | import("url").URL, data: any, options?: string | {
        encoding?: string | null | undefined;
        mode?: string | number | undefined;
        flag?: string | undefined;
    } | null | undefined): void;
    appendFile: typeof fs.appendFile;
    appendFileSync(file: string | number | Buffer | import("url").URL, data: any, options?: string | {
        encoding?: string | null | undefined;
        mode?: string | number | undefined;
        flag?: string | undefined;
    } | null | undefined): void;
    watchFile(filename: fs.PathLike, options: {
        persistent?: boolean | undefined;
        interval?: number | undefined;
    } | undefined, listener: (curr: fs.Stats, prev: fs.Stats) => void): void;
    watchFile(filename: fs.PathLike, listener: (curr: fs.Stats, prev: fs.Stats) => void): void;
    unwatchFile(filename: fs.PathLike, listener?: ((curr: fs.Stats, prev: fs.Stats) => void) | undefined): void;
    watch(filename: fs.PathLike, options: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | {
        encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null | undefined;
        persistent?: boolean | undefined;
        recursive?: boolean | undefined;
    } | null | undefined, listener?: ((event: string, filename: string) => void) | undefined): fs.FSWatcher;
    watch(filename: fs.PathLike, options: "buffer" | {
        encoding: "buffer";
        persistent?: boolean | undefined;
        recursive?: boolean | undefined;
    }, listener?: ((event: string, filename: Buffer) => void) | undefined): fs.FSWatcher;
    watch(filename: fs.PathLike, options: string | {
        encoding?: string | null | undefined;
        persistent?: boolean | undefined;
        recursive?: boolean | undefined;
    } | null, listener?: ((event: string, filename: string | Buffer) => void) | undefined): fs.FSWatcher;
    watch(filename: fs.PathLike, listener?: ((event: string, filename: string) => any) | undefined): fs.FSWatcher;
    exists: typeof fs.exists;
    existsSync(path: fs.PathLike): boolean;
    access: typeof fs.access;
    accessSync(path: fs.PathLike, mode?: number | undefined): void;
    createReadStream(path: fs.PathLike, options?: string | {
        flags?: string | undefined;
        encoding?: string | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        start?: number | undefined;
        end?: number | undefined;
        highWaterMark?: number | undefined;
    } | undefined): fs.ReadStream;
    createWriteStream(path: fs.PathLike, options?: string | {
        flags?: string | undefined;
        encoding?: string | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        start?: number | undefined;
        highWaterMark?: number | undefined;
    } | undefined): fs.WriteStream;
    fdatasync: typeof fs.fdatasync;
    fdatasyncSync(fd: number): void;
    copyFile: typeof fs.copyFile;
    copyFileSync(src: fs.PathLike, dest: fs.PathLike, flags?: number | undefined): void;
    Stats: typeof fs.Stats;
    Dirent: typeof fs.Dirent;
    ReadStream: typeof fs.ReadStream;
    WriteStream: typeof fs.WriteStream;
    constants: typeof fs.constants;
    promises: typeof fs.promises;
};
