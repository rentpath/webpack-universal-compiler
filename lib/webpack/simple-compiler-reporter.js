"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const indent_string_1 = __importDefault(require("indent-string"));
const p_utils_1 = require("../helpers/p-utils");
const wrap_1 = require("../helpers/wrap");
const renderers_1 = __importDefault(require("../helpers/renderers"));
function startReportingWebpack(compiler, options) {
    let displayStats;
    options = {
        stats: true,
        write: (str) => str && process.stderr.write(str),
        printStart: () => `${renderers_1.default.start()}\n`,
        printSuccess: ({ duration }) => `${renderers_1.default.success(duration)}\n`,
        printFailure: () => `${renderers_1.default.failure()}\n`,
        printInvalidate: () => `${renderers_1.default.invalidate()}\n`,
        printStats: ({ stats }) => `\n${indent_string_1.default(renderers_1.default.stats(stats), 4)}\n\n`,
        printError: err => `\n${indent_string_1.default(renderers_1.default.error(err), 4)}\n\n`,
        ...options
    };
    const resetDisplayStats = () => {
        if (options.stats === true || options.stats === 'once') {
            displayStats = true;
        }
    };
    const didPrintStats = () => (displayStats = options.stats === 'once' ? false : displayStats);
    const write = (str) => options.write && options.write(str);
    const onBegin = () => write(options.printStart());
    const onEnd = (compilation) => {
        if (compilation.duration) {
            write(options.printSuccess(compilation));
        }
        if (displayStats) {
            write(options.printStats(compilation));
            didPrintStats();
        }
    };
    const onError = (err) => {
        write(options.printFailure(err));
        write(options.printError(err));
    };
    const onInvalidate = () => write(options.printInvalidate());
    const stopReporting = () => {
        compiler
            .removeListener('begin', onBegin)
            .removeListener('end', onEnd)
            .removeListener('error', onError)
            .removeListener('invalidate', onInvalidate);
    };
    resetDisplayStats();
    ['run', 'unwatch'].forEach((method) => {
        compiler[method] = wrap_1.wrap(compiler[method], (fn, ...args) => p_utils_1.pFinally(fn(...args), resetDisplayStats));
    });
    compiler
        .on('begin', onBegin)
        .on('end', onEnd)
        .on('error', onError)
        .on('invalidate', onInvalidate);
    return {
        stop: stopReporting,
        options
    };
}
exports.startReportingWebpack = startReportingWebpack;
//# sourceMappingURL=simple-compiler-reporter.js.map