import { type ServiceFunction } from '../src/service';

export const mock = <T extends ServiceFunction<any, any>>(fn: T) =>
    jest.fn<ReturnType<T>, Parameters<T>>().mockImplementation(fn);

export const mockNotExpected = <T extends ServiceFunction<any, any>>(key: string) =>
    jest.fn<ReturnType<T>, Parameters<T>>().mockImplementation(() => {
        throw new Error(`Method ${key} was not expected to be called`);
    });
