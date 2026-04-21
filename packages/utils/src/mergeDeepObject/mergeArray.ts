import type { MergeOptions } from './mergeDeepObject';

export type MergeArrayValues<T, U, TOptions extends MergeOptions> = [T] extends [readonly unknown[]]
    ? [U] extends [readonly unknown[]]
        ? TOptions['mergeArrays'] extends true
            ? Array<T[number] | U[number]>
            : TOptions['mergeArrays'] extends false
              ? U
              : Array<T[number] | U[number]> | U
        : U
    : [U] extends [readonly unknown[]]
      ? U
      : U;
