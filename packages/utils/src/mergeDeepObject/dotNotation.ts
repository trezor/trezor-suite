import type { UnionToIntersection } from '@trezor/type-utils';

import type { MergeArrayValues } from './mergeArray';
import type { MergeOptions } from './mergeDeepObject';
import type { NormalizedValue, Primitive, RequiredKeys, Simplify } from './object';

type BuildObjectPath<TKey extends string, TValue> = TKey extends `${infer THead}.${infer TRest}`
    ? { [K in THead]: BuildObjectPath<TRest, TValue> }
    : { [K in TKey]: TValue };

type MarkTopLevelOptional<T extends object> = {
    [K in keyof T]?: T[K];
};

type DottedKeys<T extends object> = Extract<keyof T, `${string}.${string}`>;

type NonDottedKeys<T extends object> = Exclude<keyof T, DottedKeys<T>>;

type RequiredNonDottedKeys<T extends object> = Extract<RequiredKeys<T>, NonDottedKeys<T>>;

type OptionalNonDottedKeys<T extends object> = Exclude<NonDottedKeys<T>, RequiredNonDottedKeys<T>>;

type RequiredDottedKeys<T extends object> = Extract<RequiredKeys<T>, DottedKeys<T>>;

type OptionalDottedKeys<T extends object> = Exclude<DottedKeys<T>, RequiredDottedKeys<T>>;

type IntersectObjectUnion<T> = [T] extends [never] ? {} : UnionToIntersection<T>;

type ExpandNonDottedObject<T extends object, TOptions extends MergeOptions> = Simplify<
    {
        [K in RequiredNonDottedKeys<T>]-?: ExpandDotNotation<T[K], TOptions>;
    } & {
        [K in OptionalNonDottedKeys<T>]?: ExpandDotNotation<T[K], TOptions>;
    }
>;

type DottedRequiredEntry<
    TKey extends string,
    TValue,
    TOptions extends MergeOptions,
> = BuildObjectPath<TKey, ExpandDotNotation<TValue, TOptions>>;

type DottedOptionalEntry<
    TKey extends string,
    TValue,
    TOptions extends MergeOptions,
> = MarkTopLevelOptional<BuildObjectPath<TKey, ExpandDotNotation<TValue, TOptions>>>;

type ExpandDottedObject<T extends object, TOptions extends MergeOptions> = Simplify<
    IntersectObjectUnion<
        | {
              [K in RequiredDottedKeys<T>]: DottedRequiredEntry<K, T[K], TOptions>;
          }[RequiredDottedKeys<T>]
        | {
              [K in OptionalDottedKeys<T>]: DottedOptionalEntry<K, T[K], TOptions>;
          }[OptionalDottedKeys<T>]
    >
>;

type MergeObjectValue<
    T extends object,
    U extends object,
    K extends PropertyKey,
    TOptions extends MergeOptions,
> = K extends keyof U
    ? K extends keyof T
        ? MergeValues<NormalizedValue<T, K>, NormalizedValue<U, K>, TOptions>
        : NormalizedValue<U, K>
    : K extends keyof T
      ? NormalizedValue<T, K>
      : never;

export type MergeObjects<
    T extends object,
    U extends object,
    TOptions extends MergeOptions,
> = Simplify<
    {
        [K in keyof T | keyof U as K extends RequiredKeys<T> | RequiredKeys<U>
            ? K
            : never]-?: MergeObjectValue<T, U, K, TOptions>;
    } & {
        [K in keyof T | keyof U as K extends RequiredKeys<T> | RequiredKeys<U>
            ? never
            : K]?: MergeObjectValue<T, U, K, TOptions>;
    }
>;

export type ExpandDotNotation<T, TOptions extends MergeOptions> = [T] extends [readonly unknown[]]
    ? T
    : [T] extends [Primitive]
      ? T
      : [T] extends [object]
        ? MergeObjects<
              ExpandNonDottedObject<T, TOptions>,
              ExpandDottedObject<T, TOptions>,
              TOptions
          >
        : T;

export type MergeValues<T, U, TOptions extends MergeOptions> = [T] extends [readonly unknown[]]
    ? MergeArrayValues<T, U, TOptions>
    : [U] extends [readonly unknown[]]
      ? U
      : [T] extends [Primitive]
        ? U
        : [U] extends [Primitive]
          ? U
          : [T] extends [object]
            ? [U] extends [object]
                ? MergeObjects<T, U, TOptions>
                : U
            : U;
