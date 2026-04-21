/* eslint-disable @typescript-eslint/no-use-before-define */
// Original implementation was the https://github.com/voodoocreation/ts-deepmerge

import { typedObjectKeys } from '../typedObject';
import type { ExpandDotNotation, MergeValues } from './dotNotation';
import { isObject } from './object';
import type { ObjectMap } from './object';

export type MergeOptions = {
    mergeArrays: boolean;
    dotNotation: boolean;
};

type DefaultMergeOptions = {
    mergeArrays: true;
    dotNotation: false;
};

export type ResolvedMergeOptions<T extends Partial<MergeOptions>> = {
    mergeArrays: T extends { mergeArrays: infer TMergeArrays }
        ? TMergeArrays extends boolean
            ? TMergeArrays
            : DefaultMergeOptions['mergeArrays']
        : DefaultMergeOptions['mergeArrays'];
    dotNotation: T extends { dotNotation: infer TDotNotation }
        ? TDotNotation extends boolean
            ? TDotNotation
            : DefaultMergeOptions['dotNotation']
        : DefaultMergeOptions['dotNotation'];
};

type PrepareMergeValue<T, TOptions extends MergeOptions> = TOptions['dotNotation'] extends true
    ? ExpandDotNotation<T, TOptions>
    : T;

export type MergeTuple<
    T extends readonly unknown[],
    TOptions extends MergeOptions,
    TResult = {},
> = T extends readonly [infer TFirst, ...infer TRest]
    ? MergeTuple<
          TRest,
          TOptions,
          MergeValues<TResult, PrepareMergeValue<TFirst, TOptions>, TOptions>
      >
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

const mergeValuesWithPath = (
    target: unknown,
    value: unknown,
    [key, ...rest]: string[],
): unknown => {
    if (key === undefined) {
        return mergeValues(target, value);
    }

    if (!isObject(target)) {
        return { [key]: mergeValuesWithPath({}, value, rest) };
    }

    return { ...target, [key]: mergeValuesWithPath(target[key], value, rest) };
};

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

            if (mergeDeepObject.options.dotNotation) {
                const [first, ...rest] = key.split('.');
                result[first] = mergeValuesWithPath(result[first], current[key], rest);
            } else {
                result[key] = mergeValues(result[key], current[key]);
            }
        }

        return result;
    }, {});
}

const defaultOptions: DefaultMergeOptions = {
    mergeArrays: true,
    dotNotation: false,
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
