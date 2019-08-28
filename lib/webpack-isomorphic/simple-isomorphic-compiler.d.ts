/// <reference types="node" />
import webpack from 'webpack';
export declare function clientServerCompiler(client: webpack.Compiler | webpack.Configuration, server: webpack.Compiler | webpack.Configuration): import("events").EventEmitter & {
    client: {
        webpackConfig: webpack.Configuration;
        webpackCompiler: webpack.Compiler;
    };
    server: {
        webpackConfig: webpack.Configuration;
        webpackCompiler: webpack.Compiler;
    };
    isCompiling(): boolean;
    getCompilation(): {
        duration?: number | undefined;
        stats?: webpack.Stats | undefined;
    };
    getError(): Error | null;
    run(): Promise<{
        duration?: number | undefined;
        stats?: webpack.Stats | undefined;
    }>;
    watch(options: webpack.ICompiler.WatchOptions, handler: webpack.ICompiler.Handler): () => void;
    unwatch(): Promise<void>;
    resolve(): Promise<any>;
};
