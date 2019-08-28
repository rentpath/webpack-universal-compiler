/// <reference types="node" />
import webpack from 'webpack';
export declare function simpleWebpackCompiler(webpackType: webpack.Compiler | webpack.Configuration): import("events").EventEmitter & {
    webpackConfig: webpack.Configuration;
    webpackCompiler: webpack.Compiler;
    isCompiling(): boolean;
    getCompilation(): {
        duration?: number | undefined;
        stats?: webpack.Stats | undefined;
    };
    getError(): Error | null;
    assertIdle(calledMethod: string): void;
    run(...args: any): Promise<unknown>;
    watch(options: webpack.ICompiler.WatchOptions, handler?: webpack.ICompiler.Handler): () => void;
    unwatch(): Promise<unknown>;
    resolve(): Promise<any>;
};
