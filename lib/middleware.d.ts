import { Compiler, MultiCompiler } from 'webpack';
export default function webpackClientServerMiddleware(...args: [(MultiCompiler | Compiler), Compiler, object]): any;
