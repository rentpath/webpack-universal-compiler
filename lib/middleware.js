"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_isomorphic_compiler_1 = require("./webpack-isomorphic/simple-isomorphic-compiler");
function parseArgs(args) {
    const [argOne, argTwo, argThree] = args;
    if ('compilers' in argOne) {
        return console.log('This is a multi-compiler instance');
    }
    if (argOne.run && argTwo && argTwo.run) {
        return {
            compiler: simple_isomorphic_compiler_1.clientServerCompiler(argOne, argTwo)
        };
    }
}
function webpackClientServerMiddleware(...args) {
    const { compiler } = parseArgs(args);
}
exports.default = webpackClientServerMiddleware;
//# sourceMappingURL=middleware.js.map