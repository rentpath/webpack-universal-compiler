"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const pretty_error_1 = __importDefault(require("pretty-error"));
const symbols_1 = __importDefault(require("./symbols"));
const prettyError = new pretty_error_1.default();
prettyError.appendStyle({
    'pretty-error > header': { display: 'none' },
    'pretty-error > trace': { marginTop: 0 },
    'pretty-error > trace > item': { marginBottom: 0 }
});
const defaultStatsOptions = {
    assets: true,
    children: false,
    chunks: false,
    colors: chalk_1.default.enabled,
    hash: false,
    modules: false,
    timings: false,
    version: false,
    builtAt: false,
    entrypoints: false
};
const renderGenericError = (err) => {
    let str = '';
    if (err.code || (err.name && err.name !== 'Error')) {
        str += chalk_1.default.dim(`${err.code || err.name}: `);
    }
    str += `${err.message}\n`;
    // Add the stack
    const prettyErrStr = prettyError
        .render(err)
        .trim()
        .split('\n')
        .slice(0, -1)
        .join('\n');
    str += `${prettyErrStr}`;
    return str;
};
const renderStart = () => `${chalk_1.default.dim(symbols_1.default.start)} Compiling...`;
const renderSuccess = (duration) => {
    let str = '';
    str += `${chalk_1.default.green(symbols_1.default.success)} Compilation succeeded`;
    str += duration != null ? ` ${chalk_1.default.dim(`(${duration}ms)`)}` : '';
    return str;
};
const renderFailure = () => `${chalk_1.default.red(symbols_1.default.failure)} Compilation failed`;
const renderInvalidate = () => `${chalk_1.default.cyan(symbols_1.default.invalidate)} Compilation invalidated`;
const renderError = (err, statsOptions = defaultStatsOptions) => {
    let str = '';
    // If there's stats & compilation errors, then we just render them
    if (err.stats && err.stats.hasErrors && err.stats.hasErrors()) {
        str += `${err.message}\n\n`;
        str += renderStats(err.stats, { ...statsOptions, assets: false });
        return str;
    }
    return renderGenericError(err);
};
const renderStats = (stats, statsOptions = defaultStatsOptions) => `${stats.toString(statsOptions).trim()}`;
exports.default = {
    start: renderStart,
    success: renderSuccess,
    failure: renderFailure,
    invalidate: renderInvalidate,
    error: renderError,
    stats: renderStats
};
//# sourceMappingURL=renderers.js.map