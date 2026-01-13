import { NullablePropsRecursive } from '@trezor/type-utils';

export const mock = <T extends (...args: any[]) => any>(fn: T) =>
    jest.fn<ReturnType<T>, Parameters<T>>().mockImplementation(fn);

export const mockNotExpected = <T extends (...args: any[]) => any>(key: string) =>
    jest.fn<ReturnType<T>, Parameters<T>>().mockImplementation(() => {
        throw new Error(`Method ${key} was not expected to be called`);
    });

type RecursiveDeps = {
    [key: string]: ((...args: any[]) => any) | RecursiveDeps;
};

export type MockDeps<T extends RecursiveDeps> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
        ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
        : T[K] extends RecursiveDeps
          ? MockDeps<T[K]>
          : never;
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
            result[key] = jest.fn(value ?? mockNotExpected(key)) as MockDeps<T>[typeof key];
        } else {
            result[key] = createMockDeps(value) as MockDeps<T>[typeof key];
        }
    }

    return result as MockDeps<T>;
};
