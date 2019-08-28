/// <reference types="node" />
import { EventEmitter } from 'events';
import { simpleWebpackCompiler } from '../webpack/simple-compiler';
import { ObserveWebpackIsoCompilerState } from '../types/compiler';
declare type Compiler = ReturnType<typeof simpleWebpackCompiler>;
export declare const resetState: (state?: {}) => {
    isCompiling: boolean;
    beginAt: null;
    error: null;
    compilation: {
        stats: undefined;
        duration: undefined;
    };
};
export declare function observeIsomorphicCompilers(clientCompiler: Compiler, serverCompiler: Compiler): {
    eventEmitter: EventEmitter;
    state: ObserveWebpackIsoCompilerState;
};
export {};
