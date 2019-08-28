"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = __importDefault(require("webpack"));
const assert_1 = __importDefault(require("assert"));
const nodeFs_1 = require("../helpers/nodeFs");
const simpler_compiler_observer_1 = require("./simpler-compiler-observer");
const wrap_1 = require("../helpers/wrap");
function preventOriginalAPIDirectUsage(compiler) {
    const blacklistedMethods = ['run', 'watch'];
    compiler.webpackCompiler = new Proxy(compiler.webpackCompiler, {
        get(target, property) {
            if (blacklistedMethods.includes(property)) {
                throw new Error("Direct access to webpack compiler's public API is not allowed");
            }
            return target[property];
        }
    });
}
function simpleWebpackCompiler(webpackType) {
    const webpackCompiler = 'run' in webpackType ? webpackType : webpack_1.default(webpackType);
    const webpackConfig = 'run' in webpackType ? webpackCompiler.options : webpackType;
    const { eventEmitter, state, addHook } = simpler_compiler_observer_1.observeWebpackCompiler(webpackCompiler);
    webpackCompiler.outputFileSystem = nodeFs_1.nodeFs();
    const compiler = Object.assign(eventEmitter, {
        webpackConfig,
        webpackCompiler,
        isCompiling() {
            return state.isCompiling;
        },
        getCompilation() {
            return state.compilation;
        },
        getError() {
            return state.error;
        },
        assertIdle(calledMethod) {
            const getAssertMessage = (reason) => reason +
                (calledMethod
                    ? `, you can only call '${calledMethod}' when the compiler is idle`
                    : '');
            assert_1.default(!state.webpackWatching, getAssertMessage('Compiler is watching'));
            assert_1.default(!state.isCompiling, getAssertMessage('Compiler is running'));
        },
        run(...args) {
            compiler.assertIdle('run');
            return new Promise((resolve, reject) => {
                webpackCompiler.run(() => {
                    if (state.error) {
                        reject(state.error);
                    }
                    else {
                        resolve(state.compilation);
                    }
                });
            });
        },
        watch(options, handler = () => { }) {
            compiler.assertIdle('watch');
            if (typeof options === 'function') {
                handler = options;
                options = {};
            }
            if (typeof handler === 'undefined') {
                handler = () => { };
            }
            handler =
                handler &&
                    wrap_1.wrap(handler, handler => {
                        !state.isCompiling &&
                            handler(state.error
                                ? state.error
                                : new Error('Error, no webpack error state generated'), state.compilation);
                    });
            const webpackWatching = webpackCompiler.watch(options, handler);
            return () => {
                if (webpackWatching !== state.webpackWatching) {
                    return;
                }
                eventEmitter.emit('invalidate');
                state.webpackWatching.invalidate();
            };
        },
        unwatch() {
            if (!state.webpackWatching) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                addHook('watchClose', resolve);
                state.webpackWatching && state.webpackWatching.close(() => { });
            });
        },
        resolve() {
            const { error, compilation } = state;
            if (error) {
                return Promise.reject(error);
            }
            if (compilation) {
                return Promise.resolve(compilation);
            }
            const deferred = {
                resolve: undefined
            };
            deferred.promise = new Promise((res, rej) => {
                deferred.resolve = res;
                deferred.reject = rej;
            });
            const cleanup = () => {
                eventEmitter.removeListener('error', onError);
                eventEmitter.removeListener('end', onEnd);
            };
            const onError = (err) => {
                cleanup();
                if (deferred.reject) {
                    deferred.reject(err);
                }
            };
            const onEnd = (compilation) => {
                cleanup();
                if (deferred.resolve) {
                    deferred.resolve(compilation);
                }
            };
            compiler.on('error', onError).on('end', onEnd);
            return deferred.promise;
        }
    });
    preventOriginalAPIDirectUsage(compiler);
    return compiler;
}
exports.simpleWebpackCompiler = simpleWebpackCompiler;
//# sourceMappingURL=simple-compiler.js.map