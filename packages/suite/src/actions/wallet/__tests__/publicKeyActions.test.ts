/* eslint-disable global-require */
import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { connectInitThunk } from '@suite-common/connect-init';

import { State as DeviceState } from 'src/reducers/suite/deviceReducer';

import fixtures from '../__fixtures__/publicKeyActions';

jest.mock('@trezor/connect', () => {
    let fixture: any;
    let buttonRequest: ((e?: any) => any) | undefined;

    const getPublicKey = (_params: any) => {
        if (fixture && fixture.getPublicKey) {
            if (fixture.getPublicKey.success && buttonRequest) {
                buttonRequest({ code: 'ButtonRequest_PublicKey' });
            }
            return fixture.getPublicKey;
        }
        // trigger multiple button requests
        if (buttonRequest) {
            buttonRequest({ code: 'ButtonRequest_PublicKey' });
            buttonRequest({ code: 'some-other-code' });
            buttonRequest();
        }
        return {
            success: true,
        };
    };

    const { PROTO } = jest.requireActual('@trezor/connect');

    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => null,
            on: (event: string, cb: () => any) => {
                if (event === 'ui-button') buttonRequest = cb;
            },
            off: () => {
                buttonRequest = undefined;
            },
            getPublicKey,
            cardanoGetPublicKey: getPublicKey,
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
        },
        PROTO,
    };
});

const device = testMocks.getSuiteDevice({
    state: 'device-state',
    connected: true,
    available: true,
});

const rootReducer = combineReducers({
    device: createReducer({ devices: [device], device }, () => {}),
    wallet: combineReducers({
        selectedAccount: createReducer(
            {
                account: {
                    metadata: {},
                    networkType: 'bitcoin',
                },
            },
            () => ({}),
        ),
        accounts: createReducer([{ metadata: {}, networkType: 'bitcoin' }], () => {}),
    }),

    metadata: createReducer(
        {
            providers: [],
            selectedProvider: {},
            enabled: false,
        },
        () => ({}),
    ),
});

interface StateOverrides {
    device?: Pick<DeviceState, 'device'>;
    networkType?: string;
}

const initStore = (stateOverrides?: StateOverrides) => {
    const preloadedState = JSON.parse(JSON.stringify(rootReducer(undefined, { type: 'init' })));
    if (stateOverrides?.device) {
        preloadedState.device = stateOverrides.device;
    }
    if (stateOverrides?.networkType) {
        preloadedState.wallet.selectedAccount.account.networkType = stateOverrides.networkType;
    }
    return configureMockStore<any>({ reducer: rootReducer, preloadedState });
};

describe('PublicKeyActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('@trezor/connect').setTestFixtures(f.mocks);
            const store = initStore(f.initialState);
            await store.dispatch(connectInitThunk());
            await store.dispatch(f.action());

            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});
