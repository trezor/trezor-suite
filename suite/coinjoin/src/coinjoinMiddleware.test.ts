import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { type SelectedAccountRootState, selectedAccountReducer } from '@suite/account';
import { type LocksRootState, locksReducer } from '@suite/locks';
import { type RouterRootState, routerReducer } from '@suite/router';
import { type TorRootState, torReducer } from '@suite/tor';
import {
    type MessageSystemRootState,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import '@suite-common/test-utils/globalOverrides';

import { fixtures } from './__fixtures__/coinjoinMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { coinjoinReducer } from './coinjoinReducer';
import { type CoinjoinRootState, type SuiteOnlineRootState } from './coinjoinSelectors';
import { CoinjoinService } from './coinjoinService';

jest.mock('./coinjoinService', () => {
    const mock = jest.requireActual('./__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const messageSystem = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const rootReducer = combineReducers({
    device: createReducer({}, () => ({})),
    locks: locksReducer,
    messageSystem,
    router: routerReducer,
    suite: createReducer({ online: true }, () => ({})),
    tor: torReducer,
    discreetMode: createReducer({ isActive: false }, () => {}),
    wallet: combineReducers({
        accounts: prepareAccountsReducer({
            actionTypes: { storageLoad: mockActionType('storageLoad') },
            actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
            reducers: { storageLoadAccounts: mockReducer() },
        }),
        coinjoin: coinjoinReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = AccountsRootState &
    CoinjoinRootState &
    SelectedAccountRootState &
    LocksRootState &
    MessageSystemRootState &
    RouterRootState &
    SuiteOnlineRootState &
    TorRootState & {
        device: Record<never, never>;
        discreetMode: { isActive: boolean };
    };

const initStore = ({ device, router, suite, tor, wallet }: Partial<State> = {}) => {
    const preloadedState: State = rootReducer(undefined, { type: 'init' });

    if (device) {
        preloadedState.device = device;
    }

    if (router) {
        preloadedState.router = {
            ...preloadedState.router,
            ...router,
        };
    }

    if (suite) {
        preloadedState.suite = {
            ...preloadedState.suite,
            ...suite,
        };
    }

    if (tor) {
        preloadedState.tor = {
            ...preloadedState.tor,
            ...tor,
        };
    }

    if (wallet) {
        preloadedState.wallet = {
            ...preloadedState.wallet,
            ...wallet,
        };
    }

    return createTestCompositionRoot<void, State>({
        reducer: rootReducer,
        preloadedState,
        middleware: [coinjoinMiddleware],
    }).services.store;
};

describe('coinjoinMiddleware', () => {
    beforeEach(() => {
        CoinjoinService.getInstances().forEach(({ client }) => {
            CoinjoinService.removeInstance(asNetworkSymbol(client.settings.network));
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.state);

            if (f.connect) {
                testMocks.setTrezorConnectFixtures(f.connect);
            }

            if (f.client) {
                await CoinjoinService.createInstance({ symbol: asNetworkSymbol(f.client) });
            }

            store.dispatch(f.action);
            expect(await store.getActions()).toEqual([f.action, ...f.expectedActions]);
        });
    });
});
