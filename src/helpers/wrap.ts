export const wrap = <T, TArgs, TResult>(
  value: T,
  fn1: (value: T, ...args: TArgs[]) => TResult
) => (...args: TArgs[]) => {
  return fn1(value, ...args)
}
