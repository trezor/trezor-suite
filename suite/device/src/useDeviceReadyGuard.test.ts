import { act } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { type LocksRootState, locksInitialState, locksReducer } from '@suite/locks';
import { deviceActions } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { selectIsConnectionModalOpen } from './deviceSelectors';
import {
    type DesktopDeviceRootState,
    initialState,
    prepareDesktopDeviceReducer,
    setConnectionModal,
} from './deviceSlice';
import {
    type DeviceSessionError,
    WALLET_MISMATCH_ERROR_CODE,
    useDeviceReadyGuard,
} from './useDeviceReadyGuard';

type State = DesktopDeviceRootState & LocksRootState;

const deviceReducer = prepareDesktopDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

const readyDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: 'wallet@device:0', sessionId: 'session' },
});

const renderGuard = (selectedDevice: TrezorDevice | undefined, expectedWallet?: string) => {
    const { services } = createTestCompositionRoot<void, State>({
        reducer: combineReducers({ device: deviceReducer, locks: locksReducer }),
        preloadedState: {
            device: { ...initialState, selectedDevice },
            locks: locksInitialState,
        },
    });
    const onFailed = mock<(error: DeviceSessionError) => void>();
    const { result, unmount } = renderHookWithStoreProvider(
        () => useDeviceReadyGuard({ onFailed, expectedWallet }),
        { services },
    );

    return { result, unmount, store: services.store, onFailed };
};

const runGuard = async (selectedDevice: TrezorDevice | undefined) => {
    const { result, store, onFailed } = renderGuard(selectedDevice);

    return {
        isReady: await result.current(),
        isConnectionModalOpen: selectIsConnectionModalOpen(store.getState()),
        onFailed,
    };
};

// Starts the guard for a device that is not connected and waits for the connection modal.
const runGuardUntilConnectionModal = async (selectedDevice: TrezorDevice | undefined) => {
    const guard = renderGuard(selectedDevice);
    let isReady: Promise<boolean> | undefined;

    await act(() => {
        isReady = guard.result.current();
    });

    return { ...guard, isReady };
};

describe('useDeviceReadyGuard', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('lets the action continue once the device confirms the wallet session', async () => {
        const getDeviceState = jest
            .spyOn(TrezorConnect, 'getDeviceState')
            .mockResolvedValue({ success: true, payload: { state: {} } });

        const { isReady, isConnectionModalOpen, onFailed } = await runGuard(readyDevice);

        expect(isReady).toBe(true);
        expect(isConnectionModalOpen).toBe(false);
        expect(getDeviceState).toHaveBeenCalledWith({
            device: expect.objectContaining({ state: readyDevice.state }),
        });
        expect(onFailed).not.toHaveBeenCalled();
    });

    it.each([
        ['no device is selected', undefined],
        ['the device is disconnected', mockSuiteDevice({ connected: false, available: false })],
        ['the wallet is unavailable', mockSuiteDevice({ connected: true, available: false })],
    ])('opens the connection modal without asking the device when %s', async (_, device) => {
        const getDeviceState = jest.spyOn(TrezorConnect, 'getDeviceState');

        const { store } = await runGuardUntilConnectionModal(device);

        expect(selectIsConnectionModalOpen(store.getState())).toBe(true);
        expect(getDeviceState).not.toHaveBeenCalled();
    });

    it('continues with the session check once the device is connected', async () => {
        const getDeviceState = jest
            .spyOn(TrezorConnect, 'getDeviceState')
            .mockResolvedValue({ success: true, payload: { state: {} } });
        const { store, isReady } = await runGuardUntilConnectionModal(
            mockSuiteDevice({ connected: false, available: false }),
        );

        await act(() => {
            store.dispatch(deviceActions.updateSelectedDevice(readyDevice));
            store.dispatch(setConnectionModal(false));
        });

        await expect(isReady).resolves.toBe(true);
        expect(getDeviceState).toHaveBeenCalledWith({
            device: expect.objectContaining({ state: readyDevice.state }),
        });
    });

    it('skips the PIN prompt if the connected wallet does not own the account', async () => {
        const getDeviceState = jest.spyOn(TrezorConnect, 'getDeviceState');
        const { result, onFailed } = renderGuard(readyDevice, 'other-wallet@device:0');

        await expect(result.current()).resolves.toBe(false);
        expect(getDeviceState).not.toHaveBeenCalled();
        expect(onFailed).toHaveBeenCalledWith(
            expect.objectContaining({ code: WALLET_MISMATCH_ERROR_CODE }),
        );
    });

    it('ignores a successful device response after the screen is left', async () => {
        const { result, unmount } = renderGuard(readyDevice);
        jest.spyOn(TrezorConnect, 'getDeviceState').mockImplementationOnce(() => {
            unmount();

            return Promise.resolve({ success: true, payload: { state: {} } });
        });

        await expect(result.current()).resolves.toBe(false);
    });

    it('reports a wallet mismatch when the selected wallet changes during the PIN prompt', async () => {
        const { store, result, onFailed } = renderGuard(readyDevice);
        jest.spyOn(TrezorConnect, 'getDeviceState').mockImplementationOnce(() => {
            store.dispatch(
                deviceActions.updateSelectedDevice(
                    mockSuiteDevice({
                        connected: true,
                        available: true,
                        state: { staticSessionId: 'other-wallet@device:0' },
                    }),
                ),
            );

            return Promise.resolve({ success: true, payload: { state: {} } });
        });

        await act(async () => {
            await expect(result.current()).resolves.toBe(false);
        });
        expect(onFailed).toHaveBeenCalledWith(
            expect.objectContaining({ code: WALLET_MISMATCH_ERROR_CODE }),
        );
    });

    it('reports a disconnected device when it disconnects during the PIN prompt', async () => {
        const { store, result, onFailed } = renderGuard(readyDevice);
        jest.spyOn(TrezorConnect, 'getDeviceState').mockImplementationOnce(() => {
            store.dispatch(
                deviceActions.updateSelectedDevice({ ...readyDevice, connected: false }),
            );

            return Promise.resolve({ success: true, payload: { state: {} } });
        });

        await act(async () => {
            await expect(result.current()).resolves.toBe(false);
        });
        expect(onFailed).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'Device_Disconnected' }),
        );
    });

    it('stops the action when the connection modal is closed without a device', async () => {
        const getDeviceState = jest.spyOn(TrezorConnect, 'getDeviceState');
        const { store, isReady } = await runGuardUntilConnectionModal(undefined);

        await act(() => {
            store.dispatch(setConnectionModal(false));
        });

        await expect(isReady).resolves.toBe(false);
        expect(getDeviceState).not.toHaveBeenCalled();
    });

    it('stops the action when the screen is left while waiting for the device', async () => {
        const { unmount, isReady } = await runGuardUntilConnectionModal(undefined);

        unmount();

        await expect(isReady).resolves.toBe(false);
    });

    it.each([
        ['cancels the PIN entry', 'Failure_PinCancelled'],
        ['closes the passphrase prompt', 'Method_Interrupted'],
    ] as const)(
        'stops the action without reporting a failure when the user %s',
        async (_, code) => {
            jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
                success: false,
                error: { code, message: 'cancelled' },
            });

            const { isReady, isConnectionModalOpen, onFailed } = await runGuard(readyDevice);

            expect(isReady).toBe(false);
            expect(isConnectionModalOpen).toBe(false);
            expect(onFailed).not.toHaveBeenCalled();
        },
    );

    it('stops the action and hands over the device error when the session does not match', async () => {
        jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
            success: false,
            error: { code: 'Device_InvalidState', message: 'Invalid device state' },
        });

        const { isReady, onFailed } = await runGuard(readyDevice);

        expect(isReady).toBe(false);
        expect(onFailed).toHaveBeenCalledWith({
            code: 'Device_InvalidState',
            message: 'Invalid device state',
        });
    });

    it('stops the action without asking the device when no session is known', async () => {
        const getDeviceState = jest.spyOn(TrezorConnect, 'getDeviceState');

        const { isReady, isConnectionModalOpen, onFailed } = await runGuard(
            mockSuiteDevice({ connected: true, available: true }),
        );

        expect(isReady).toBe(false);
        expect(isConnectionModalOpen).toBe(false);
        expect(getDeviceState).not.toHaveBeenCalled();
        expect(onFailed).toHaveBeenCalledWith({
            code: undefined,
            message: 'Device session is not available',
        });
    });
});
