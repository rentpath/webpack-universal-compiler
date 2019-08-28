import { SimpleCompiler, ReporterOptionsSingleCompiler } from '../types/compiler';
export declare function startReportingWebpack(compiler: SimpleCompiler, options: ReporterOptionsSingleCompiler): {
    stop: () => void;
    options: ReporterOptionsSingleCompiler;
};
