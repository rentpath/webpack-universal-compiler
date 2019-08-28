"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_compiler_1 = require("../webpack/simple-compiler");
const simple_isomorphic_compiler_observer_1 = require("./simple-isomorphic-compiler-observer");
const p_utils_1 = require("../helpers/p-utils");
const wrap_1 = require("../helpers/wrap");
const createSubFacade = (compiler) => ({
    webpackConfig: compiler.webpackConfig,
    webpackCompiler: compiler.webpackCompiler
});
function clientServerCompiler(client, server) {
    const clientCompiler = simple_compiler_1.simpleWebpackCompiler(client);
    const serverCompiler = simple_compiler_1.simpleWebpackCompiler(server);
    const { eventEmitter, state } = simple_isomorphic_compiler_observer_1.observeIsomorphicCompilers(clientCompiler, serverCompiler);
    const compiler = Object.assign(eventEmitter, {
        client: createSubFacade(clientCompiler),
        server: createSubFacade(serverCompiler),
        isCompiling() {
            return state.isCompiling;
        },
        getCompilation() {
            return state.compilation;
        },
        getError() {
            return state.error;
        },
        run() {
            clientCompiler.assertIdle('run');
            serverCompiler.assertIdle('run');
            return p_utils_1.pSettle([clientCompiler.run(), serverCompiler.run()]).then(() => {
                if (state.error) {
                    throw state.error;
                }
                return state.compilation;
            });
        },
        watch(options, handler) {
            clientCompiler.assertIdle('watch');
            serverCompiler.assertIdle('watch');
            if (typeof options === 'function') {
                handler = options;
                options = {};
            }
            handler =
                handler &&
                    wrap_1.wrap(handler, handler => {
                        !state.isCompiling &&
                            handler(state.error
                                ? state.error
                                : new Error('Error, no webpack error state generated'), state.compilation);
                    });
            const clientInvalidate = clientCompiler.watch(options, handler);
            const serverInvalidate = serverCompiler.watch(options, handler);
            return () => {
                eventEmitter.emit('invalidate');
                simple_isomorphic_compiler_observer_1.resetState(state);
                clientInvalidate();
                serverInvalidate();
            };
        },
        unwatch() {
            return Promise.all([
                clientCompiler.unwatch(),
                serverCompiler.unwatch()
            ]).then(() => { });
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
    return compiler;
}
exports.clientServerCompiler = clientServerCompiler;
//# sourceMappingURL=simple-isomorphic-compiler.js.map