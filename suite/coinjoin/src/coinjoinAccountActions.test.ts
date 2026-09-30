import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { type SelectedAccountState, selectedAccountReducer } from '@suite/account';
import { type LocksState, locksReducer } from '@suite/locks';
import { type MessageSystemState, prepareMessageSystemReducer } from '@suite-common/message-system';
import { type NetworksState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, initPreloadedState, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsState, prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';

import * as fixtures from './__fixtures__/coinjoinAccountActions';
import * as coinjoinAccountActions from './coinjoinAccountActions';
import * as coinjoinClientActions from './coinjoinClientActions';
import { coinjoinReducer } from './coinjoinReducer';
import { CoinjoinService } from './coinjoinService';
import { type CoinjoinState } from './coinjoinTypes';

jest.mock('./coinjoinService', () => {
    const mock = jest.requireActual('./__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const DEVICE = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_id:0' },
    connected: true,
});

const networks = mockNetworksState([
    asNetworkSymbol('btc'),
    asNetworkSymbol('test'),
    asNetworkSymbol('regtest'),
]);

const rootReducer = combineReducers({
    networks: () => networks,
    suite: createReducer(
        {
            settings: {
                debug: {},
            },
        },
        () => ({}),
    ),
    locks: locksReducer,
    messageSystem: prepareMessageSystemReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
    }),
    device: createReducer({ devices: [DEVICE], selectedDevice: DEVICE }, () => ({})),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: prepareAccountsReducer({
            actionTypes: { storageLoad: mockActionType('storageLoad') },
            actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
            reducers: { storageLoadAccounts: mockReducer() },
        }),
        selectedAccount: selectedAccountReducer,
        blockchain: () => ({ btc: { blockHeight: 150 } }),
        transactions: () => ({ transactions: {} }),
    }),
});

// These fixtures dispatch several account thunks and assert changes across their shared reducers.
type State = {
    networks: NetworksState;
    suite: { settings: { debug: Record<never, never> } };
    locks: LocksState;
    messageSystem: MessageSystemState;
    device: { devices: TrezorDevice[]; selectedDevice: TrezorDevice };
    modal: Record<never, never>;
    wallet: {
        coinjoin: CoinjoinState;
        accounts: AccountsState;
        selectedAccount: SelectedAccountState;
        blockchain: { btc: { blockHeight: number } };
        transactions: { transactions: Record<never, never> };
    };
};
type Wallet = Partial<State['wallet']> & { devices?: State['device']['devices'] };

const initStore = ({ accounts, coinjoin, devices }: Wallet = {}) =>
    createTestCompositionRoot<void, State>({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                ...(devices !== undefined ? { device: { devices } } : {}),
                wallet: { accounts, coinjoin },
            },
        }),
    }).services.store;

describe('coinjoinAccountActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        CoinjoinService.getInstances().forEach(({ client }) => {
            CoinjoinService.removeInstance(asNetworkSymbol(client.settings.network));
        });
    });

    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const store = initStore();
            testMocks.setTrezorConnectFixtures(f.connect);
            jest.spyOn(console, 'log').mockImplementation(() => {});

            await store.dispatch(
                coinjoinAccountActions.createCoinjoinAccountThunk(
                    f.params.network as any,
                    f.params.account as any,
                ),
            ); // params are incomplete

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.startCoinjoinSession.forEach(f => {
        it(`startCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            testMocks.setTrezorConnectFixtures(f.connect);
            // @ts-expect-error params are incomplete
            await store.dispatch(coinjoinAccountActions.startCoinjoinSessionThunk(f.params, {}));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.stopCoinjoinSession.forEach(f => {
        it(`stopCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance({ symbol: f.client as any });
            }

            await store.dispatch(coinjoinClientActions.stopCoinjoinSessionThunk(f.param));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinAccounts.forEach(f => {
        it(`restoreCoinjoinAccounts: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinAccountsThunk());

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinSession.forEach(f => {
        it(`restoreCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance({ symbol: f.client as any });
            }

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinSessionThunk(f.param));

            const actions = store.getActions();

            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
