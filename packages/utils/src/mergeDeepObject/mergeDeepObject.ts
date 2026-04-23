/* eslint-disable @typescript-eslint/no-use-before-define */
// Original implementation was the https://github.com/voodoocreation/ts-deepmerge

import { typedObjectKeys } from '../typedObject';
import type { MergeArrayValues } from './mergeArray';
import { isObject } from './object';
import type { NormalizedValue, ObjectMap, Primitive, RequiredKeys, Simplify } from './object';

export type MergeOptions = {
    mergeArrays: boolean;
};

type DefaultMergeOptions = {
    mergeArrays: true;
};

export type ResolvedMergeOptions<T extends Partial<MergeOptions>> = {
    mergeArrays: T extends { mergeArrays: infer TMergeArrays }
        ? TMergeArrays extends boolean
            ? TMergeArrays
            : DefaultMergeOptions['mergeArrays']
        : DefaultMergeOptions['mergeArrays'];
};

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

type MergeObjects<T extends object, U extends object, TOptions extends MergeOptions> = Simplify<
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

export type MergeTuple<
    T extends readonly unknown[],
    TOptions extends MergeOptions,
    TResult = {},
> = T extends readonly [infer TFirst, ...infer TRest]
    ? MergeTuple<TRest, TOptions, MergeValues<TResult, TFirst, TOptions>>
    : TResult;

export type MergeDeepObject = {
    <T extends readonly object[]>(...objects: T): MergeTuple<T, DefaultMergeOptions>;
    options: MergeOptions;
    withOptions<TOptions extends Partial<MergeOptions>, TObjects extends readonly object[]>(
        overrideOptions: TOptions,
        ...objects: TObjects
    ): MergeTuple<TObjects, ResolvedMergeOptions<TOptions>>;
};

const protectedObjectKeys: readonly string[] = ['__proto__', 'constructor', 'prototype'];

const mergeValues = (target: unknown, value: unknown) => {
    if (Array.isArray(target) && Array.isArray(value)) {
        return mergeDeepObject.options.mergeArrays
            ? Array.from(new Set(target.concat(value)))
            : value;
    }

    if (isObject(target) && isObject(value)) {
        return mergeDeepObject(target, value);
    }

    return value;
};

function mergeDeepObjectBase<T extends readonly object[]>(
    ...objects: T
): MergeTuple<T, DefaultMergeOptions>;
function mergeDeepObjectBase(...objects: readonly object[]) {
    return objects.reduce<ObjectMap>((result, current) => {
        if (Array.isArray(current)) {
            throw new TypeError('Arguments provided to ts-deepmerge must be objects, not arrays.');
        }

        if (!isObject(current)) {
            return result;
        }

        for (const key of typedObjectKeys(current)) {
            if (typeof key !== 'string' || protectedObjectKeys.includes(key)) {
                continue;
            }

            result[key] = mergeValues(result[key], current[key]);
        }

        return result;
    }, {});
}

const defaultOptions: DefaultMergeOptions = {
    mergeArrays: true,
};

export const mergeDeepObject: MergeDeepObject = Object.assign(mergeDeepObjectBase, {
    options: defaultOptions,

    withOptions<TOptions extends Partial<MergeOptions>, T extends readonly object[]>(
        overrideOptions: TOptions,
        ...objects: T
    ): MergeTuple<T, ResolvedMergeOptions<TOptions>> {
        mergeDeepObject.options = {
            ...defaultOptions,
            ...overrideOptions,
        };

        const result = mergeDeepObject(...objects);

        mergeDeepObject.options = defaultOptions;

        return result;
    },
});
