import { Compiler, MultiCompiler } from 'webpack';
import { clientServerCompiler } from './webpack-isomorphic/simple-isomorphic-compiler';
export declare function webpackClientServerMiddleware(...args: [(MultiCompiler | Compiler), Compiler, object]): any;
export default function webpackClientServerMiddleware(...args: [(MultiCompiler | Compiler), Compiler, object]): void;
export { clientServerCompiler };
