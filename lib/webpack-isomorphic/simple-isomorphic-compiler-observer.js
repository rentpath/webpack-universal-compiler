"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
exports.resetState = (state = {}) => {
    return Object.assign(state, {
        isCompiling: false,
        beginAt: null,
        error: null,
        compilation: {
            stats: undefined,
            duration: undefined
        }
    });
};
function observeIsomorphicCompilers(clientCompiler, serverCompiler) {
    const eventEmitter = new events_1.EventEmitter();
    const state = exports.resetState({});
    const onBegin = () => {
        if (state.isCompiling) {
            return;
        }
        Object.assign(state, {
            isCompiling: true,
            beginAt: Date.now(),
            error: null,
            compilation: null
        });
        eventEmitter.emit('begin');
    };
    const onError = (type, err) => {
        err.message += ` (${type})`;
        onEnd();
    };
    const onEnd = () => {
        if (clientCompiler.isCompiling() || serverCompiler.isCompiling()) {
            return;
        }
        const error = clientCompiler.getError() || serverCompiler.getError();
        if (error) {
            Object.assign(state, {
                isCompiling: false,
                error,
                compilation: null
            });
        }
        else {
            const compilation = {
                duration: state.beginAt ? Date.now() - state.beginAt : null,
                clientStats: clientCompiler.getCompilation().stats,
                serverStats: serverCompiler.getCompilation().stats
            };
            Object.defineProperty(compilation, 'stats', {
                value: compilation.clientStats,
                enumerable: false,
                configurable: true
            });
            Object.assign(state, {
                isCompiling: false,
                error: null,
                compilation
            });
            eventEmitter.emit('end', compilation);
        }
    };
    eventEmitter.on('error', () => { });
    clientCompiler
        .on('begin', onBegin)
        .on('end', onEnd)
        .on('error', err => onError('client', err));
    serverCompiler
        .on('begin', onBegin)
        .on('end', onEnd)
        .on('error', err => onError('server', err));
    return { eventEmitter, state };
}
exports.observeIsomorphicCompilers = observeIsomorphicCompilers;
//# sourceMappingURL=simple-isomorphic-compiler-observer.js.map