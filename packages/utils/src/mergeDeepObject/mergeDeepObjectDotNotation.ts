// Original implementation was the https://github.com/voodoocreation/ts-deepmerge

import { mergeDeepObject } from './mergeDeepObject';
import type { MergeOptions } from './mergeDeepObject';
import { isObject } from './object';
import type { ObjectMap } from './object';

const protectedObjectKeys: readonly string[] = ['__proto__', 'constructor', 'prototype'];

const buildPathObject = (path: readonly string[], value: unknown): ObjectMap => {
    const [key, ...rest] = path;

    if (key === undefined) {
        return {};
    }

    if (rest.length === 0) {
        return { [key]: value };
    }

    return { [key]: buildPathObject(rest, value) };
};

const toObjectMap = (value: object): ObjectMap => Object.fromEntries(Object.entries(value));

const expandDotNotationObject = (value: ObjectMap, options: MergeOptions): ObjectMap =>
    Object.keys(value).reduce<ObjectMap>((result, key): ObjectMap => {
        if (protectedObjectKeys.includes(key)) {
            return result;
        }

        const currentValue: unknown = Reflect.get(value, key);
        const nextValue: unknown = isObject(currentValue)
            ? expandDotNotationObject(currentValue, options)
            : currentValue;
        const expandedValue: ObjectMap = key.includes('.')
            ? buildPathObject(key.split('.'), nextValue)
            : { [key]: nextValue };

        return mergeDeepObject.withOptions(options, result, expandedValue);
    }, {});

export type MergeDeepObjectDotNotation = {
    <T extends object>(base: T, ...objects: readonly object[]): T;
    options: MergeOptions;
    withOptions<T extends object>(
        overrideOptions: Partial<MergeOptions>,
        base: T,
        ...objects: readonly object[]
    ): T;
};

const defaultOptions: MergeOptions = {
    mergeArrays: true,
};

let currentOptions = defaultOptions;

function mergeDeepObjectDotNotationBase<T extends object>(
    base: T,
    ...objects: readonly object[]
): T;

function mergeDeepObjectDotNotationBase(base: object, ...objects: readonly object[]) {
    const expandedBase = expandDotNotationObject(toObjectMap(base), currentOptions);
    const expandedObjects = objects.map(object =>
        expandDotNotationObject(toObjectMap(object), currentOptions),
    );

    return mergeDeepObject.withOptions(currentOptions, expandedBase, ...expandedObjects);
}

export const mergeDeepObjectDotNotation: MergeDeepObjectDotNotation = Object.assign(
    mergeDeepObjectDotNotationBase,
    {
        options: defaultOptions,

        withOptions<T extends object>(
            overrideOptions: Partial<MergeOptions>,
            base: T,
            ...objects: readonly object[]
        ) {
            mergeDeepObjectDotNotation.options = {
                ...defaultOptions,
                ...overrideOptions,
            };
            currentOptions = mergeDeepObjectDotNotation.options;

            const result = mergeDeepObjectDotNotation(base, ...objects);

            mergeDeepObjectDotNotation.options = defaultOptions;
            currentOptions = defaultOptions;

            return result;
        },
    },
);
