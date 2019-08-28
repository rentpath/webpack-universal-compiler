"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simple_isomorphic_compiler_1 = require("./webpack-isomorphic/simple-isomorphic-compiler");
const middleware_1 = __importDefault(require("./middleware"));
module.exports = {
    webpackClientServerMiddleware: middleware_1.default,
    clientServerCompiler: simple_isomorphic_compiler_1.clientServerCompiler
};
//# sourceMappingURL=commonjs.js.map