import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore, testMocks } from '@suite-common/test-utils';

import { accountsReducer } from '@wallet-reducers';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import {
    onCoinjoinRoundChanged,
    onCoinjoinClientRequest,
    signCoinjoinTx,
} from '../coinjoinClientActions';
import * as fixtures from '../__fixtures__/coinjoinClientActions';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

const DEVICE = testMocks.getSuiteDevice({ state: 'device-state', connected: true });

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            device: DEVICE,
            settings: {
                debug: {},
            },
        },
        {},
    ),
    devices: createReducer([DEVICE], {}),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['devices'] };

const initStore = ({ accounts, coinjoin, devices }: Wallet = {}) => {
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
                await Promise.all(
                    f.params.map(p =>
                        store.dispatch(
                            onCoinjoinRoundChanged({ round: p as any }), // params are incomplete
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
});
