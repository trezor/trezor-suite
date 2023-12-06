/* eslint-disable require-await */
import { retryConnectPromise, ensureSingleRunningInstance } from '../asyncUtils';

describe('retryPromise', () => {
    let mockFunction: jest.Mock;

    beforeEach(() => {
        mockFunction = jest.fn();
    });

    afterEach(() => {});

    test('should resolve successfully when promise succeeds', async () => {
        mockFunction.mockResolvedValueOnce({ success: true });
        const result = await retryConnectPromise(mockFunction, 3, 1000);
        expect(result).toEqual({ success: true });
        expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    test('should retry until success is true', async () => {
        mockFunction
            .mockResolvedValueOnce({ success: false })
            .mockResolvedValueOnce({ success: false })
            .mockResolvedValueOnce({ success: true });

        const promise = await retryConnectPromise(mockFunction, 5, 100);

        expect(mockFunction).toHaveBeenCalledTimes(3);
        expect(promise).toEqual({ success: true });
    });

    test('should retry on promise rejection and then resolve', async () => {
        mockFunction.mockRejectedValueOnce(new Error('Error')).mockResolvedValue({ success: true });

        const promise = await retryConnectPromise(mockFunction, 5, 100);

        expect(promise).toEqual({ success: true });
        expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    test('should stop retrying after maximum retries are reached', async () => {
        mockFunction.mockRejectedValue(new Error('Error'));

        const promise = retryConnectPromise(mockFunction, 3, 100);

        await expect(promise).rejects.toThrow();
        expect(mockFunction).toHaveBeenCalledTimes(3);
    });
});

describe('ensureSingleRunningInstance', () => {
    // Mock function that returns a promise
    const mockAsyncFunction = jest.fn(
        (arg: number) =>
            new Promise<number>(resolve => {
                setTimeout(() => resolve(arg), 100);
            }),
    );

    const singleMockAsyncFunction = ensureSingleRunningInstance(mockAsyncFunction);

    beforeEach(() => {
        mockAsyncFunction.mockClear();
    });

    test('should return a promise', async () => {
        const result = singleMockAsyncFunction(1);
        expect(result).toBeInstanceOf(Promise);
    });

    test('should return same promise for concurrent calls with same arguments', () => {
        const promise1 = singleMockAsyncFunction(1);
        const promise2 = singleMockAsyncFunction(1);
        expect(promise1).toBe(promise2);
    });

    test('should return different promises for calls with different arguments', () => {
        const promise1 = singleMockAsyncFunction(1);
        const promise2 = singleMockAsyncFunction(2);
        expect(promise1).not.toBe(promise2);
    });

    test('should resolve promises correctly', async () => {
        const result = await singleMockAsyncFunction(1);
        expect(result).toBe(1);
    });

    test('should clear the ongoing promise map after resolution', async () => {
        const promise1 = singleMockAsyncFunction(1);
        await promise1;
        const promise2 = singleMockAsyncFunction(1);
        expect(promise1).not.toBe(promise2);
    });
});
