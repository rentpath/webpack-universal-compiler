import { SimpleCompiler, ReporterOptionsSingleCompiler } from '../types/compiler';
export declare function startReportingWebpackIsomorphic(compiler: SimpleCompiler, options: ReporterOptionsSingleCompiler): {
    stop: () => void;
    options: ReporterOptionsSingleCompiler;
};
