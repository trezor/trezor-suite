import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore } from '@suite-common/test-utils';
import { promiseAllSequence } from '@trezor/utils';

import { accountsReducer } from '@wallet-reducers';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';
import {
    onCoinjoinRoundChanged,
    onCoinjoinClientRequest,
    signCoinjoinTx,
    setDebugSettings,
} from '../coinjoinClientActions';
import * as fixtures from '../__fixtures__/coinjoinClientActions';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            device: fixtures.DEVICE,
            settings: {
                debug: {},
            },
        },
        {},
    ),
    devices: createReducer([fixtures.DEVICE], {}),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['devices'] };

const initStore = ({ accounts, coinjoin, devices, selectedAccount }: Wallet = {}) => {
    // TODO: didn't found better way how to generate initial state or pass it dynamically to rootReducer creator
    const preloadedState: State = JSON.parse(
        JSON.stringify(rootReducer(undefined, { type: 'init' })),
    );
    if (devices) {
        preloadedState.devices = devices;
    }
    if (accounts) {
        preloadedState.wallet.accounts = accounts;
    }
    if (coinjoin) {
        preloadedState.wallet.coinjoin = {
            ...preloadedState.wallet.coinjoin,
            ...coinjoin,
        };
    }
    if (selectedAccount) {
        preloadedState.wallet.selectedAccount = selectedAccount;
    }
    // State != suite AppState, therefore <any>
    const store = configureMockStore<any>({ reducer: rootReducer, preloadedState });
    return store;
};

describe('coinjoinClientActions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.onCoinjoinRoundChanged.forEach(f => {
        it(`onCoinjoinRoundChanged: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            TrezorConnect.setTestFixtures(f.connect);

            if (Array.isArray(f.params)) {
                await promiseAllSequence(
                    f.params.map(
                        (round: any) => () =>
                            store.dispatch(
                                onCoinjoinRoundChanged({ round }), // params are incomplete
                            ),
                    ),
                );
            } else {
                await store.dispatch(
                    onCoinjoinRoundChanged({ round: f.params as any }), // params are incomplete
                );
            }

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);

            if (typeof f.result.trezorConnectCalledTimes === 'number') {
                expect(TrezorConnect.setBusy).toBeCalledTimes(f.result.trezorConnectCalledTimes);
            }
            if (f.result.trezorConnectCallsWith) {
                expect(TrezorConnect.setBusy).toHaveBeenLastCalledWith(
                    expect.objectContaining(f.result.trezorConnectCallsWith),
                );
            }
        });
    });

    fixtures.onCoinjoinClientRequest.forEach(f => {
        it(`onCoinjoinClientRequest: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            TrezorConnect.setTestFixtures(f.connect);

            const response = await store.dispatch(onCoinjoinClientRequest(f.params as any));

            expect(response).toMatchObject(f.result.response);

            expect(TrezorConnect.getOwnershipProof).toBeCalledTimes(
                f.result.trezorConnectCalledTimes,
            );
        });
    });

    fixtures.signCoinjoinTx.forEach(f => {
        it(`signCoinjoinTx: ${f.description}`, async () => {
            const store = initStore(f.state as any);
            TrezorConnect.setTestFixtures(f.connect);

            const response = await store.dispatch(
                signCoinjoinTx(f.params as any), // params are incomplete
            );

            expect(TrezorConnect.signTransaction).toBeCalledTimes(
                f.result.trezorConnectCalledTimes,
            );

            f.result.trezorConnectCalledWith.forEach((params, index) => {
                expect(TrezorConnect.signTransaction.mock.calls[index][0]).toMatchObject(params);
            });

            expect(response).toMatchObject(f.result.response);
        });
    });

    it('setDebugSettings', () => {
        const store = initStore();
        expect(store.getState().wallet.coinjoin.debug).toBeUndefined();

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { test: 'public' } }));

        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public' },
        });

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { regtest: 'localhost' } }));
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public', regtest: 'localhost' },
        });

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { test: 'staging' } }));
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'staging', regtest: 'localhost' },
        });
    });
});
