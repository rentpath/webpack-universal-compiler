"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const figures_1 = __importDefault(require("figures"));
exports.default = {
    start: figures_1.default.bullet,
    success: figures_1.default.tick,
    failure: figures_1.default.cross,
    invalidate: figures_1.default.info
};
//# sourceMappingURL=symbols.js.map