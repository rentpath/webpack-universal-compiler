"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const simple_compiler_reporter_1 = require("../webpack/simple-compiler-reporter");
const indent_string_1 = __importDefault(require("indent-string"));
const renderers_1 = __importDefault(require("../helpers/renderers"));
const symbols_1 = __importDefault(require("../helpers/symbols"));
const extraSymbols = {
    ...symbols_1.default,
    separator: process.platform !== 'win32' ? '━' : '-'
};
const extraRenderers = {
    ...renderers_1.default,
    banner: (label) => {
        let str;
        str = `${chalk_1.default.inverse(` ${label} ${' '.repeat(35 - label.length - 1)}`)}\n`;
        str += chalk_1.default.dim(extraSymbols.separator.repeat(35));
        return str;
    }
};
function startReportingWebpackIsomorphic(compiler, options) {
    options = {
        printStats: ({ clientStats, serverStats }) => {
            let str = '';
            str += `\n${extraRenderers.banner('CLIENT')}\n`;
            str += `${extraRenderers.stats(clientStats)}\n`;
            str += `\n${extraRenderers.banner('SERVER')}\n`;
            str += `${extraRenderers.stats(serverStats)}\n\n`;
            return indent_string_1.default(str, 4);
        },
        ...options
    };
    return simple_compiler_reporter_1.startReportingWebpack(compiler, options);
}
exports.startReportingWebpackIsomorphic = startReportingWebpackIsomorphic;
//# sourceMappingURL=simple-isomorphic-compiler-reporter.js.map