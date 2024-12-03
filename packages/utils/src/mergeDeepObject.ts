/* eslint-disable @typescript-eslint/no-use-before-define */
// code shamelessly stolen from https://github.com/voodoocreation/ts-deepmerge

import { Keys } from '@trezor/type-utils';

type TIndexValue<T, K extends PropertyKey, D = never> = T extends any
    ? K extends keyof T
        ? T[K]
        : D
    : never;

type TPartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>> extends infer O
    ? { [P in keyof O]: O[P] }
    : never;

type TFunction = (...a: any[]) => any;

type TPrimitives = string | number | boolean | bigint | symbol | Date | TFunction;

type TMerged<T> = [T] extends [Array<any>]
    ? { [K in keyof T]: TMerged<T[K]> }
    : [T] extends [TPrimitives]
      ? T
      : [T] extends [object]
        ? TPartialKeys<{ [K in Keys<T>]: TMerged<TIndexValue<T, K>> }, never>
        : T;

// istanbul ignore next
const isObject = (obj: any): obj is IObject => {
    if (typeof obj === 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf === 'function') {
            const prototype = Object.getPrototypeOf(obj);

            return prototype === Object.prototype || prototype === null;
        }

        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    return false;
};

interface IObject {
    [key: string]: any;
}

const mergeValuesWithPath = (target: any, value: any, [key, ...rest]: string[]): any => {
    if (key === undefined) {
        return mergeValues(target, value);
    } else if (!isObject(target)) {
        return { [key]: mergeValuesWithPath({}, value, rest) };
    } else {
        return { ...target, [key]: mergeValuesWithPath(target[key], value, rest) };
    }
};

const mergeValues = (target: any, value: any) => {
    if (Array.isArray(target) && Array.isArray(value)) {
        return mergeDeepObject.options.mergeArrays
            ? Array.from(new Set((target as unknown[]).concat(value)))
            : value;
    } else if (isObject(target) && isObject(value)) {
        return mergeDeepObject(target, value);
    } else {
        return value;
    }
};

export const mergeDeepObject = <T extends IObject[]>(...objects: T): TMerged<T[number]> =>
    objects.reduce((result, current) => {
        if (Array.isArray(current)) {
            throw new TypeError('Arguments provided to ts-deepmerge must be objects, not arrays.');
        }

        Object.keys(current).forEach(key => {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) {
                return;
            }

            if (mergeDeepObject.options.dotNotation) {
                const [first, ...rest] = key.split('.');
                result[first] = mergeValuesWithPath(result[first], current[key], rest);
            } else {
                result[key] = mergeValues(result[key], current[key]);
            }
        });

        return result;
    }, {}) as any;

interface IOptions {
    mergeArrays: boolean;
    dotNotation: boolean;
}

const defaultOptions: IOptions = {
    mergeArrays: true,
    dotNotation: false,
};

mergeDeepObject.options = defaultOptions;

mergeDeepObject.withOptions = <T extends IObject[]>(options: Partial<IOptions>, ...objects: T) => {
    mergeDeepObject.options = {
        ...defaultOptions,
        ...options,
    };

    const result = mergeDeepObject(...objects);

    mergeDeepObject.options = defaultOptions;

    return result;
};
