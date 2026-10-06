import { combineReducers } from '@reduxjs/toolkit';

import {
    type AppRememberedPermission,
    CALL_SOURCE_WEB,
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    connectPopupActions,
    prepareConnectPopupReducer,
} from '@suite-common/connect-popup';
import { mock, mockNotExpected } from '@suite-common/dependency-injection';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import TrezorConnect, { CORE_CALL, type CallMethodAnyResponse, POPUP } from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';

import { useConnectPopupWebextension } from './useConnectPopupWebextension';

type DeviceResponse = Awaited<CallMethodAnyResponse>;
type SuiteLifecycleState = { lifecycle: { status: 'ready' } };
type State = ConnectPopupCallThunkState & { suite: SuiteLifecycleState };

const EXTENSION_ID = 'abcdefghijklmnopabcdefghijklmnop';
const OTHER_EXTENSION_ID = 'ponmlkjihgfedcbaponmlkjihgfedcba';

const device = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    useEmptyPassphrase: true,
});
const deviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: device };
const suiteState: SuiteLifecycleState = { lifecycle: { status: 'ready' } };

const createServices = (permissions: AppRememberedPermission[] = []) =>
    createTestCompositionRoot<ConnectPopupCallThunkDeps, State>({
        services: () => ({
            analytics: {
                init: mockNotExpected('init'),
                enable: mockNotExpected('enable'),
                disable: mockNotExpected('disable'),
                isEnabled: mockNotExpected('isEnabled'),
                setUrl: mockNotExpected('setUrl'),
                setLoggerEnabled: mockNotExpected('setLoggerEnabled'),
                report: mock(),
            },
            lockDevice: mock<LockDevice>(),
        }),
        reducer: combineReducers({
            connectPopup: prepareConnectPopupReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
            device: (state: DeviceReducerState = deviceState) => state,
            suite: (state: SuiteLifecycleState = suiteState) => state,
        }),
        preloadedState: {
            connectPopup: { activeCall: undefined, permissions },
            device: deviceState,
            suite: suiteState,
        },
    }).services;

type Services = ReturnType<typeof createServices>;

const handshake = {
    type: POPUP.HANDSHAKE,
    id: 'handshake',
    payload: { manifest: { appName: 'App', appUrl: 'https://app.example' }, version: '10.0.1' },
};
const accountInfoCall = {
    type: CORE_CALL,
    id: 'call',
    payload: { method: 'getAccountInfo', coin: 'btc', path: "m/84'/0'/0'" },
};

const settle = async () => {
    for (let i = 0; i < 20; i++) {
        await act(() => new Promise(resolve => setTimeout(resolve, 0)));
    }
};

// The extension's service worker delivers every message by rewriting the URL fragment.
const writeFragment = async (extensionId: string, message: object) => {
    window.location.hash = `extension-id=${extensionId}&message=${encodeURIComponent(
        JSON.stringify(message),
    )}`;
    await settle();
};

describe('useConnectPopupWebextension', () => {
    const sendMessage = jest.fn();
    let services: Services;

    const openSession = async (extensionId: string) => {
        window.location.hash = '';
        const hook = renderHookWithStoreProvider(() => useConnectPopupWebextension(), {
            services,
        });
        await writeFragment(extensionId, handshake);

        return hook;
    };

    beforeEach(() => {
        Object.assign(globalThis, { chrome: { runtime: { sendMessage } } });
        jest.spyOn(window, 'close').mockImplementation(() => {});
        jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
            Promise.resolve(
                '__info' in params
                    ? ({
                          success: true,
                          payload: {
                              info: 'Get account info',
                              requiredPermissions: [
                                  { permission: 'read_account_info', coin: 'btc' },
                              ],
                              useUi: false,
                          },
                      } as DeviceResponse)
                    : ({ success: true, payload: {} } as DeviceResponse),
            ),
        );
    });

    afterEach(async () => {
        // Settle a call left waiting for permissions, so that the next test can start its own.
        if (services.store.getState().connectPopup.activeCall?.state === 'permission-request') {
            services.store.dispatch(
                connectPopupActions.rejectPermissions(TypedError('Method_Cancel')),
            );
            await settle();
        }
        jest.restoreAllMocks();
        sendMessage.mockReset();
        Reflect.deleteProperty(globalThis, 'chrome');
    });

    it('starts a call written by the extension that opened the session', async () => {
        services = createServices();
        const { unmount } = await openSession(EXTENSION_ID);
        await writeFragment(EXTENSION_ID, accountInfoCall);

        expect(services.store.getState().connectPopup.activeCall?.state).toBe('permission-request');
        unmount();
    });

    it('keeps the calls and responses of a session with the extension that opened it', async () => {
        services = createServices();
        const { unmount } = await openSession(EXTENSION_ID);
        await writeFragment(OTHER_EXTENSION_ID, accountInfoCall);

        expect(services.store.getState().connectPopup.activeCall).toBeUndefined();
        expect(sendMessage).not.toHaveBeenCalledWith(OTHER_EXTENSION_ID, expect.anything());
        unmount();
    });

    it('ignores a message that names no extension id', async () => {
        services = createServices();
        const { unmount } = await openSession(EXTENSION_ID);
        window.location.hash = `message=${encodeURIComponent(JSON.stringify(accountInfoCall))}`;
        await settle();

        expect(services.store.getState().connectPopup.activeCall).toBeUndefined();
        unmount();
    });

    it('asks for permissions also when they are remembered for the extension id', async () => {
        services = createServices([
            {
                type: CALL_SOURCE_WEB,
                origin: EXTENSION_ID,
                manifest: { appName: 'App' },
                allowedPermissions: [{ permission: 'read_account_info', coin: 'btc' }],
            },
        ]);
        const { unmount } = await openSession(EXTENSION_ID);
        await writeFragment(EXTENSION_ID, accountInfoCall);

        expect(services.store.getState().connectPopup.activeCall?.state).toBe('permission-request');
        unmount();
    });

    it('ignores a hash whose extension id is not a Chromium extension id', async () => {
        services = createServices();
        const { unmount } = await openSession('https://app.example');
        await writeFragment('https://app.example', accountInfoCall);

        expect(services.store.getState().connectPopup.activeCall).toBeUndefined();
        expect(sendMessage).not.toHaveBeenCalled();
        unmount();
    });

    it('keeps working on a page without the chrome global', async () => {
        Reflect.deleteProperty(globalThis, 'chrome');
        services = createServices();
        const { unmount } = await openSession(EXTENSION_ID);
        await writeFragment(EXTENSION_ID, accountInfoCall);

        expect(services.store.getState().connectPopup.activeCall?.state).toBe('permission-request');
        unmount();
    });
});
