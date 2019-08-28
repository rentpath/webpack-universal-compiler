/// <reference types="node" />
import { EventEmitter } from 'events';
import webpack from 'webpack';
import { Tapable } from 'tapable';
import { ObserveWebpackCompilerState } from '../types/compiler';
export declare function observeWebpackCompiler(webpackCompiler: webpack.Compiler): {
    eventEmitter: EventEmitter;
    state: ObserveWebpackCompilerState;
    addHook: <Name extends "shouldEmit" | "done" | "additionalPass" | "beforeRun" | "run" | "emit" | "afterEmit" | "thisCompilation" | "compilation" | "normalModuleFactory" | "contextModuleFactory" | "beforeCompile" | "compile" | "make" | "afterCompile" | "watchRun" | "failed" | "invalid" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "entryOption">(name: Name, method: Tapable.Handler | "tap" | "tapAsync", callback?: Tapable.Handler | undefined) => void;
};
