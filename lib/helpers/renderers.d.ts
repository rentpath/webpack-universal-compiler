import webpack from 'webpack';
import { ErrStats } from '../types/compiler';
declare const _default: {
    start: () => string;
    success: (duration?: number | undefined) => string;
    failure: () => string;
    invalidate: () => string;
    error: (err: ErrStats, statsOptions?: {
        assets: boolean;
        children: boolean;
        chunks: boolean;
        colors: boolean;
        hash: boolean;
        modules: boolean;
        timings: boolean;
        version: boolean;
        builtAt: boolean;
        entrypoints: boolean;
    }) => string;
    stats: (stats: webpack.Stats, statsOptions?: {
        assets: boolean;
        children: boolean;
        chunks: boolean;
        colors: boolean;
        hash: boolean;
        modules: boolean;
        timings: boolean;
        version: boolean;
        builtAt: boolean;
        entrypoints: boolean;
    }) => string;
};
export default _default;
