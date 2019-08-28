export declare function pFinally<T>(promise: Promise<T>, onFinally?: () => void): Promise<T>;
export declare const pReflect: <T>(promise: Promise<T>) => Promise<{
    isFulfilled: boolean;
    isRejected: boolean;
    value: T;
    reason?: undefined;
} | {
    isFulfilled: boolean;
    isRejected: boolean;
    reason: any;
    value?: undefined;
}>;
export declare const pTry: <T extends any[]>(fn: (...args: T) => any, ...args: any) => Promise<unknown>;
export declare const pLimit: (concurrency: number) => Promise<never> | ((fn: any, ...args: any[]) => Promise<unknown>);
export declare const pSettle: <T>(promises: Promise<T>[], options?: {}) => Promise<({
    isFulfilled: boolean;
    isRejected: boolean;
    value: unknown;
    reason?: undefined;
} | {
    isFulfilled: boolean;
    isRejected: boolean;
    reason: any;
    value?: undefined;
})[] | undefined>;
