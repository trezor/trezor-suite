import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import {
    type DeviceReducerState,
    type DeviceRootState,
    deviceInitialState,
} from '@suite-common/device';
import { type LockDevice, type LockDeviceDep } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    blockchainInitialState,
    selectNetworkBackendType,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type MethodInfo, type PermissionRequest } from '@trezor/connect';
import { mock, mockNotExpected, toGetter } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import {
    type ConnectPopupStateRootState,
    prepareConnectPopupReducer,
    selectConnectPopupCall,
} from './connectPopupReducer';
import { type ConnectCallSource } from './connectPopupTypes';
import { createPopupConnect } from './createPopupConnect';
import { createPopupGetNetwork } from './createPopupGetNetwork';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { call: jest.fn(), updateConnectSettings: jest.fn() },
}));

const connectCall = jest.mocked(TrezorConnect.call);

type TestState = ConnectPopupStateRootState & DeviceRootState & BlockchainRootState;

const dapp: ConnectCallSource = {
    type: 'walletconnect',
    origin: 'https://dapp.example',
    manifest: { appName: 'dapp' },
};

const selectedDevice = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    state: undefined,
    useEmptyPassphrase: true,
});
const deviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice };

const createStore = () => {
    const report = mock<AnalyticsDep['analytics']['report']>();
    const lockDevice = mock<LockDevice>();
    const { store } = createTestCompositionRoot<
        WithServices<AnalyticsDep & LockDeviceDep>,
        TestState
    >({
        services: () => ({
            analytics: {
                init: mockNotExpected('init'),
                enable: mockNotExpected('enable'),
                disable: mockNotExpected('disable'),
                isEnabled: mockNotExpected('isEnabled'),
                setUrl: mockNotExpected('setUrl'),
                setLoggerEnabled: mockNotExpected('setLoggerEnabled'),
                report,
            },
            lockDevice,
        }),
        reducer: combineReducers({
            connectPopup: prepareConnectPopupReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
            device: (state: DeviceReducerState = deviceState) => state,
            wallet: (state = { blockchain: blockchainInitialState }) => state,
        }),
    }).services;

    return { store, report, lockDevice };
};

// Connect describes a call when asked with `__info`, and makes it otherwise.
const mockConnect = (requiredPermissions: PermissionRequest[], payload: object = {}) => {
    const methodInfo: MethodInfo = { info: 'Sign message', requiredPermissions, useUi: true };

    connectCall.mockImplementation(params =>
        Promise.resolve({ success: true, payload: '__info' in params ? methodInfo : payload }),
    );
};

const getDeviceCalls = () => connectCall.mock.calls.filter(([params]) => !('__info' in params));

describe(createPopupGetNetwork.name, () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        connectCall.mockReset();
    });

    it('signs with the network through a popup call made for the dapp', async () => {
        mockConnect([{ permission: 'sign_message' }], {
            address: 'bc1q-address',
            signature: 'signature',
        });
        const { store, report, lockDevice } = createStore();
        const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

        const signed = await createPopupGetNetwork({
            source: dapp,
            dispatch: store.dispatch,
            getNetworkBackend: toGetter(store.getState, selectNetworkBackendType),
        })({
            symbol: account.symbol,
            accountType: account.accountType,
        })?.capabilities.messageSigning?.sign({
            device: mockSuiteDevice({ path: 'chosen-by-the-caller' }),
            account,
            path: "m/84'/0'/0'/0/0",
            message: '00ff',
            isHex: true,
        });

        expect(signed).toEqual({
            success: true,
            payload: { address: 'bc1q-address', signature: 'signature' },
        });
        expect(getDeviceCalls()).toEqual([
            [
                {
                    device: { path: '1', instance: 0, state: undefined, useEmptyPassphrase: true },
                    method: 'signMessage',
                    path: "m/84'/0'/0'/0/0",
                    coin: 'btc',
                    message: '00ff',
                    hex: true,
                    no_script_type: false,
                },
            ],
        ]);
        expect(selectConnectPopupCall(store.getState())).toMatchObject({
            state: 'finished',
            method: 'signMessage',
            source: dapp,
        });
        expect(report).toHaveBeenCalledWith({
            type: events.connectPopupCallEvent.name,
            payload: expect.objectContaining({ method: 'signMessage' }),
        });
        expect(lockDevice).toHaveBeenCalledWith(false);
    });

    it('answers with the popup refusing the call, without reaching the device', async () => {
        mockConnect([{ permission: 'management' }]);
        const { store } = createStore();

        const response = await createPopupConnect({
            source: dapp,
            dispatch: store.dispatch,
        }).ethereumSignMessage({ path: "m/44'/60'/0'/0/0", message: 'hello' });

        expect(response).toMatchObject({ success: false, error: { code: 'Method_NotAllowed' } });
        expect(getDeviceCalls()).toEqual([]);
    });
});
