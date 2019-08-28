"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrap = (value, fn1) => (...args) => {
    return fn1(value, ...args);
};
//# sourceMappingURL=wrap.js.map