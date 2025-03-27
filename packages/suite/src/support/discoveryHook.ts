import { TrezorDevice } from '@suite-common/suite-types';
import { getSelectedDevice } from '@suite-common/suite-utils';
import { Discovery } from '@suite-common/wallet-types';

const REMOVE_DISCOVERY_HOOK_TIMEOUT: number = 5 * 60 * 1000; // 5 minute

export class DeregisterError extends Error {
    static code: string = 'discovery-hook-deregistered';
    constructor() {
        super(DeregisterError.code);
    }
}

export class TimeoutError extends Error {
    static code: string = 'discovery-hook-timeout';
    constructor() {
        super(TimeoutError.code);
    }
}

export const isDiscoveryHookHandledError = (err: any) =>
    Boolean(
        err && 'message' in err && [DeregisterError.code, TimeoutError.code].includes(err.message),
    );

export const createDiscoveryHook = (
    {
        hookTimeout,
        localSetTimeout,
        localClearTimeout,
    }: {
        hookTimeout: number;
        localSetTimeout?: typeof setTimeout;
        localClearTimeout?: typeof clearTimeout;
    } = {
        hookTimeout: REMOVE_DISCOVERY_HOOK_TIMEOUT,
        localSetTimeout: setTimeout,
        localClearTimeout: clearTimeout,
    },
) => {
    let selectors: {
        deviceToSelect: TrezorDevice;
        type: 'complete' | 'auth';
        timeoutId: null | NodeJS.Timeout;
        callbacks: {
            resolve: (params: { state: Discovery['deviceState']; device: TrezorDevice }) => void;
            reject: (error: Error) => void;
        };
    }[] = [];

    const registerHook = (type: 'complete' | 'auth', deviceToSelect: TrezorDevice) => {
        let selectorCallbacks:
            | {
                  resolve: (params: {
                      state: Discovery['deviceState'];
                      device: TrezorDevice;
                  }) => void;
                  reject: (error: Error) => void | undefined;
              }
            | undefined;

        const hookPromise = new Promise<{
            state: Discovery['deviceState'];
            device: TrezorDevice;
        }>((resolve, reject) => {
            selectorCallbacks = { resolve, reject };
        });

        const selectorEntity: (typeof selectors)[number] = {
            deviceToSelect,
            type,
            timeoutId: null,
            callbacks: {
                resolve: ({
                    state,
                    device,
                }: {
                    state: Discovery['deviceState'];
                    device: TrezorDevice;
                }) => {
                    if (selectorCallbacks?.resolve) {
                        selectorCallbacks.resolve({
                            state,
                            device,
                        });
                    }
                },
                reject: (error: Error) => {
                    if (selectorCallbacks?.reject) {
                        selectorCallbacks.reject(error);
                    }
                },
            },
        };

        selectorEntity.timeoutId =
            (localSetTimeout ?? setTimeout)(() => {
                selectors = selectors.filter(descriptor => {
                    const notTheOne = descriptor !== selectorEntity;

                    if (notTheOne) {
                        return true;
                    }

                    descriptor.callbacks.reject(new TimeoutError());

                    return false;
                });
            }, hookTimeout) ?? null;

        selectors.push(selectorEntity);

        hookPromise.catch(err => {
            if (!isDiscoveryHookHandledError(err)) {
                throw err;
            }
        });

        return hookPromise;
    };

    const registerDiscoveryCompleteHook = (
        deviceToSelect: TrezorDevice,
    ): Promise<{
        state: Discovery['deviceState'];
        device: TrezorDevice;
    }> => registerHook('complete', deviceToSelect);

    const triggerHooks = (
        deviceState: Discovery['deviceState'],
        device: TrezorDevice,
        triggerType: 'complete' | 'auth',
    ) => {
        selectors = selectors.filter(({ deviceToSelect, type, timeoutId, callbacks }) => {
            if (type !== triggerType) {
                return true;
            }
            const isRegisteredDevice = getSelectedDevice(device, [deviceToSelect]);
            if (isRegisteredDevice) {
                callbacks.resolve?.({
                    state: deviceState,
                    device,
                });

                if (timeoutId) {
                    (localClearTimeout ?? clearTimeout)(timeoutId);
                }

                return false;
            }

            return true;
        });
    };

    const triggerDiscoveryCompletedHooks = (
        deviceState: Discovery['deviceState'],
        device: TrezorDevice,
    ) => triggerHooks(deviceState, device, 'complete');

    const triggerDiscoveryAuthHooks = (
        deviceState: Discovery['deviceState'],
        device: TrezorDevice,
    ) => triggerHooks(deviceState, device, 'auth');

    const registerDiscoveryAuthHook = (device: TrezorDevice) => registerHook('auth', device);

    const deregisterHook = (device: TrezorDevice, triggerType: 'complete' | 'auth') => {
        selectors = selectors.filter(({ deviceToSelect, type, timeoutId, callbacks }) => {
            if (type !== triggerType) {
                return true;
            }
            const isRegisteredDevice = getSelectedDevice(device, [deviceToSelect]);
            if (isRegisteredDevice) {
                callbacks.reject?.(new DeregisterError());
                if (timeoutId) {
                    (localClearTimeout ?? clearTimeout)(timeoutId);
                }

                return false;
            }

            return true;
        });
    };

    const deregisterAuthHook = (device: TrezorDevice) => {
        deregisterHook(device, 'auth');
    };

    return {
        deregisterAuthHook,
        registerDiscoveryCompleteHook,
        registerDiscoveryAuthHook,
        triggerDiscoveryCompletedHooks,
        triggerDiscoveryAuthHooks,
    };
};

export type DiscoveryHook = ReturnType<typeof createDiscoveryHook>;
