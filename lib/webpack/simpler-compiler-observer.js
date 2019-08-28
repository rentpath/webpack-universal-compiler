"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const wrap_1 = require("../helpers/wrap");
const createAddHook = (webpackCompiler) => (name, method, callback) => {
    if (typeof method === 'function') {
        callback = method;
        method = 'tap';
    }
    if (callback && webpackCompiler.hooks) {
        webpackCompiler.hooks[name][method]('simple-compiler', (...args) => callback && callback(...args));
    }
};
function observeWebpackCompiler(webpackCompiler) {
    const eventEmitter = new events_1.EventEmitter();
    const state = {
        isCompiling: false,
        error: null,
        compilation: {
            duration: undefined
        },
        webpackWatching: null
    };
    const addHook = createAddHook(webpackCompiler);
    // Avoid NodeJS global throw if there's no error listeners
    eventEmitter.on('error', () => { });
    webpackCompiler.run = wrap_1.wrap(webpackCompiler.run, (run, callback) => {
        Object.assign(state, {
            isCompiling: true,
            error: null,
            compilation: null
        });
        eventEmitter.emit('begin');
        run.call(webpackCompiler, (error, stats) => {
            if (error) {
                Object.assign(state, {
                    isCompiling: false,
                    error,
                    compilation: null
                });
                eventEmitter.emit('error', error);
            }
            callback(error, stats);
        });
    });
    addHook('done', (stats) => {
        if (stats.hasErrors()) {
            const error = Object.assign(new Error('Webpack compilation failed'), {
                stats
            });
            Object.assign(state, {
                isCompiling: false,
                error,
                compilation: null
            });
            eventEmitter.emit('error', error);
        }
        else {
            Object.assign(state, {
                isCompiling: false,
                error: null,
                compilation: {
                    stats,
                    duration: stats.endTime && stats.startTime
                        ? stats.endTime - stats.startTime
                        : null
                }
            });
            eventEmitter.emit('end', state.compilation);
        }
    });
    addHook('watchRun', 'tapAsync', (_compiler, callback) => {
        Object.assign(state, {
            isCompiling: true,
            error: null,
            compilation: null
        });
        eventEmitter.emit('begin');
        callback();
    });
    addHook('failed', error => {
        Object.assign(state, { isCompiling: false, error, compilation: null });
        eventEmitter.emit('error', error);
    });
    webpackCompiler.watch = wrap_1.wrap(webpackCompiler.watch, (watch, options, handler) => {
        state.webpackWatching = watch.call(webpackCompiler, options, handler);
        return state.webpackWatching;
    });
    addHook('watchClose', () => {
        state.webpackWatching = null;
        if (state.isCompiling) {
            const error = Object.assign(new Error('Webpack compilation cancelled'), {
                hideStack: true
            });
            Object.assign(state, { isCompiling: false, error, compilation: null });
            eventEmitter.emit('error', error);
        }
    });
    return {
        eventEmitter,
        state,
        addHook
    };
}
exports.observeWebpackCompiler = observeWebpackCompiler;
//# sourceMappingURL=simpler-compiler-observer.js.map