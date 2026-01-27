import { NullablePropsRecursive } from '@trezor/type-utils';

import { mockNotExpected } from './mock';
import { RecursiveDeps, ServiceFunction } from '../service';

export type MockDeps<T extends RecursiveDeps> = {
    [K in keyof T]: T[K] extends ServiceFunction<any, any>
        ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
        : T[K] extends RecursiveDeps
          ? MockDeps<T[K]>
          : T[K];
};

/**
 * This utility helps you to mock complex dependencies of services.
 *
 * Example:
 *   ```
 *   type Dependencies = {
 *     a: () => A;
 *     b: () => B;
 *     c: { d: () => D };
 *   };
 *   ```
 *   The `createMockDeps` then recursively wraps every property with jest.fn mock.
 *   You can pass partial implementation structure. You omit some dependencies
 *   (by passing `null`) and the default (failing) implementation is used.
 */
export const createMockDeps = <T extends RecursiveDeps>(
    deps: NullablePropsRecursive<T>,
): MockDeps<T> => {
    const result: Partial<MockDeps<T>> = {};

    for (const key in deps) {
        const value = deps[key];

        if (typeof value === 'function' || value === null) {
            // Service is a function, so we create jest.fn mock (or provide default throwing impl.)
            // It must be failing to fail the test, if it's not mocked we assume it SHALL NOT be called
            result[key] = jest.fn(value ?? mockNotExpected(key)) as MockDeps<T>[typeof key];
        } else if (typeof value === 'object') {
            // Recursive case, dependency is an object containing other dependencies/function
            result[key] = createMockDeps(value as RecursiveDeps) as MockDeps<T>[typeof key];
        } else {
            // Dependency is just a value, and we pass it
            result[key] = value as MockDeps<T>[typeof key];
        }
    }

    return result as MockDeps<T>;
};
