import { TrezorDevice } from '@suite-common/suite-types';
import { Discovery } from '@suite-common/wallet-types';

import { DeregisterError, DiscoveryHook, TimeoutError } from '../discoveryHook';

export const createMockDiscoveryHook: () => jest.Mocked<DiscoveryHook> = jest.fn(() => {
    const registerDiscoveryCompleteHook = jest.fn();
    const registerDiscoveryAuthHook = jest.fn();
    const triggerDiscoveryCompletedHooks = jest.fn();
    const triggerDiscoveryAuthHooks = jest.fn();
    const deregisterAuthHook = jest.fn();

    registerDiscoveryCompleteHook.mockImplementation((device: TrezorDevice) =>
        Promise.resolve({
            state: 'state@device-id:1' as Discovery['deviceState'],
            device,
        }),
    );

    registerDiscoveryAuthHook.mockImplementation((device: TrezorDevice) =>
        Promise.resolve({
            state: 'state@device-id:1' as Discovery['deviceState'],
            device,
        }),
    );

    triggerDiscoveryCompletedHooks.mockImplementation(
        (_deviceState: Discovery['deviceState'], _device: TrezorDevice) => {},
    );

    triggerDiscoveryAuthHooks.mockImplementation(
        (_deviceState: Discovery['deviceState'], _device: TrezorDevice) => {},
    );

    deregisterAuthHook.mockImplementation((_device: TrezorDevice) => {});

    const simulateTimeout = () => {
        registerDiscoveryCompleteHook.mockImplementation(() => Promise.reject(new TimeoutError()));
        registerDiscoveryAuthHook.mockImplementation(() => Promise.reject(new TimeoutError()));
    };

    const simulateDeregister = () => {
        registerDiscoveryCompleteHook.mockImplementation(() =>
            Promise.reject(new DeregisterError()),
        );
        registerDiscoveryAuthHook.mockImplementation(() => Promise.reject(new DeregisterError()));
    };

    const resetMocks = () => {
        registerDiscoveryCompleteHook.mockClear();
        registerDiscoveryAuthHook.mockClear();
        triggerDiscoveryCompletedHooks.mockClear();
        triggerDiscoveryAuthHooks.mockClear();
        deregisterAuthHook.mockClear();

        registerDiscoveryCompleteHook.mockImplementation((device: TrezorDevice) =>
            Promise.resolve({
                state: 'state@device-id:1' as Discovery['deviceState'],
                device,
            }),
        );
        registerDiscoveryAuthHook.mockImplementation((device: TrezorDevice) =>
            Promise.resolve({
                state: 'state@device-id:1' as Discovery['deviceState'],
                device,
            }),
        );
    };

    return {
        registerDiscoveryCompleteHook,
        registerDiscoveryAuthHook,
        triggerDiscoveryCompletedHooks,
        triggerDiscoveryAuthHooks,
        deregisterAuthHook,

        _simulateTimeout: simulateTimeout,
        _simulateDeregister: simulateDeregister,
        _resetMocks: resetMocks,
    };
});
