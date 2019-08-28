export declare const wrap: <T, TArgs, TResult>(value: T, fn1: (value: T, ...args: TArgs[]) => TResult) => (...args: TArgs[]) => TResult;
