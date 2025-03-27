import { TrezorDevice } from '@suite-common/suite-types';
import { Discovery } from '@suite-common/wallet-types';

import {
    DeregisterError,
    TimeoutError,
    createDiscoveryHook,
    isDiscoveryHookHandledError,
} from '../discoveryHook';

describe('discoveryHook', () => {
    const mockDevice: TrezorDevice = {
        id: 'mock-device-id',
        path: 'mock-device-path',
        instance: 1,
        features: {
            device_id: 'mock-device-id',
        },
        connected: true,
        available: true,
        mode: 'normal',
        firmware: 'valid',
        status: 'available',
        type: 'acquired',
    } as TrezorDevice;

    const differentDevice: TrezorDevice = {
        id: 'different-device-id',
        path: 'different-device-path',
        instance: 1,
        features: {
            device_id: 'different-device-id',
        },
        connected: true,
        available: true,
        mode: 'normal',
        firmware: 'valid',
        status: 'available',
        type: 'acquired',
    } as TrezorDevice;

    const mockDeviceState: Discovery['deviceState'] = 'state@device-id:1';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Error classes', () => {
        it('DeregisterError should have the correct code', () => {
            const error = new DeregisterError();
            expect(error.message).toBe('discovery-hook-deregistered');
            expect(DeregisterError.code).toBe('discovery-hook-deregistered');
        });

        it('TimeoutError should have the correct code', () => {
            const error = new TimeoutError();
            expect(error.message).toBe('discovery-hook-timeout');
            expect(TimeoutError.code).toBe('discovery-hook-timeout');
        });
    });

    describe('isDiscoveryHookHandledError', () => {
        it('should return true for DeregisterError', () => {
            const error = new DeregisterError();
            expect(isDiscoveryHookHandledError(error)).toBe(true);
        });

        it('should return true for TimeoutError', () => {
            const error = new TimeoutError();
            expect(isDiscoveryHookHandledError(error)).toBe(true);
        });

        it('should return false for other errors', () => {
            const error = new Error('some other error');
            expect(isDiscoveryHookHandledError(error)).toBe(false);
        });

        it('should return false for non-error objects', () => {
            expect(isDiscoveryHookHandledError(null)).toBe(false);
            expect(isDiscoveryHookHandledError(undefined)).toBe(false);
            expect(isDiscoveryHookHandledError({})).toBe(false);
        });
    });

    describe('createDiscoveryHook', () => {
        describe('registerDiscoveryCompleteHook', () => {
            it('should call clearTimeout when hook is triggered and resolved', async () => {
                const clearTimeoutSpy = jest.fn<void, [NodeJS.Timeout]>();
                const setTimeoutSpy = jest
                    .fn<ReturnType<typeof setTimeout>, Parameters<typeof setTimeout>>()
                    .mockReturnValue(123456 as unknown as NodeJS.Timeout);

                const hook = createDiscoveryHook({
                    hookTimeout: 2000,
                    localClearTimeout: clearTimeoutSpy as unknown as typeof clearTimeout,
                    localSetTimeout: setTimeoutSpy as unknown as typeof setTimeout,
                });

                const hookPromise = hook.registerDiscoveryCompleteHook(mockDevice);

                hook.triggerDiscoveryCompletedHooks(mockDeviceState, mockDevice);
                await hookPromise;

                expect(clearTimeoutSpy).toHaveBeenCalledWith(123456);
                clearTimeoutSpy.mockRestore();
                setTimeoutSpy.mockRestore();
            });

            it('should register a hook and resolve when triggered', async () => {
                const hook = createDiscoveryHook({ hookTimeout: 2000 });

                const hookPromise = hook.registerDiscoveryCompleteHook(mockDevice);

                hook.triggerDiscoveryCompletedHooks(mockDeviceState, mockDevice);

                const result = await hookPromise;

                expect(result).toEqual({
                    state: mockDeviceState,
                    device: mockDevice,
                });
            });

            it('should timeout after the specified timeout period', async () => {
                let timeoutCallback: null | (() => void) = null;

                const mockLocalSetTimeout = (callback: () => void) => {
                    timeoutCallback = callback;

                    return 123456 as unknown as NodeJS.Timeout;
                };
                const hook = createDiscoveryHook({
                    hookTimeout: 1000,
                    localSetTimeout: mockLocalSetTimeout as unknown as typeof setTimeout,
                    localClearTimeout: clearInterval,
                });

                const hookPromise = hook.registerDiscoveryCompleteHook(mockDevice);
                // @ts-expect-error: weird never here
                timeoutCallback?.();

                await expect(hookPromise).rejects.toThrow(TimeoutError);
            });
        });

        describe('registerDiscoveryAuthHook', () => {
            it('should register an auth hook and resolve when triggered', async () => {
                const hook = createDiscoveryHook({ hookTimeout: 2000 });

                const hookPromise = hook.registerDiscoveryAuthHook(mockDevice);

                hook.triggerDiscoveryAuthHooks(mockDeviceState, mockDevice);

                const result = await hookPromise;

                expect(result).toEqual({
                    state: mockDeviceState,
                    device: mockDevice,
                });
            });
        });

        describe('deregisterAuthHook', () => {
            it('should deregister an auth hook and reject the promise', async () => {
                const hook = createDiscoveryHook({ hookTimeout: 2000 });

                const hookPromise = hook.registerDiscoveryAuthHook(mockDevice);

                hook.deregisterAuthHook(mockDevice);

                await expect(hookPromise).rejects.toThrow(DeregisterError);
            });
        });

        describe('triggerHooks', () => {
            it('should not trigger hooks for different devices', async () => {
                let timeoutCallback: null | (() => void) = null;

                const mockLocalSetTimeout = (callback: () => void) => {
                    timeoutCallback = callback;

                    return 123456 as unknown as NodeJS.Timeout;
                };
                const hook = createDiscoveryHook({
                    hookTimeout: 20,
                    localSetTimeout: mockLocalSetTimeout as unknown as typeof setTimeout,
                    localClearTimeout: clearInterval,
                });

                const hookPromise = hook.registerDiscoveryCompleteHook(mockDevice);

                hook.triggerDiscoveryCompletedHooks(mockDeviceState, differentDevice);

                let isFulfilled: boolean = false;
                // @ts-expect-error: weird never here
                timeoutCallback?.();

                try {
                    isFulfilled = await Promise.race<boolean>([
                        hookPromise.then(() => true),
                        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 10)),
                    ]);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_err) {
                    expect(isFulfilled).toBe(false);
                }
            });

            it('should not trigger auth hooks when triggering complete hooks', async () => {
                const hook = createDiscoveryHook({ hookTimeout: 200 });

                const authHookPromise = hook.registerDiscoveryAuthHook(mockDevice);

                hook.triggerDiscoveryCompletedHooks(mockDeviceState, mockDevice);
                jest.advanceTimersByTime(100);

                let isFulfilled: boolean = false;

                try {
                    isFulfilled = await Promise.race<boolean>([
                        authHookPromise.then(() => true),
                        new Promise<boolean>(resolve => {
                            setTimeout(() => resolve(false), 10);
                            jest.advanceTimersByTime(10);
                        }),
                    ]);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_err) {
                    expect(isFulfilled).toBe(false);
                }
            });
        });

        describe('custom timeout', () => {
            it('should use the provided timeout value', async () => {
                const customTimeout = 2000;
                const hook = createDiscoveryHook({
                    hookTimeout: customTimeout,
                    localSetTimeout: setTimeout,
                    localClearTimeout: clearTimeout,
                });

                const hookPromise = hook.registerDiscoveryCompleteHook(mockDevice);

                jest.advanceTimersByTime(customTimeout - 100);

                const isRejectedBeforeTimeout = await Promise.race([
                    hookPromise.then(() => false).catch(() => true),
                    new Promise(resolve => {
                        setTimeout(() => resolve(false), 10);
                        jest.advanceTimersByTime(10);
                    }),
                ]);

                expect(isRejectedBeforeTimeout).toBe(false);

                jest.advanceTimersByTime(100);

                await expect(hookPromise).rejects.toThrow(TimeoutError);
            });
        });
    });
});
