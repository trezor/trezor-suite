import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock, testMocks } from '@suite-common/test-utils';

import { walletSettingsFixtures } from './walletSettingsActions.fixtures';
import { prepareWalletSettingsReducer } from '../../src';

const settingsReducer = prepareWalletSettingsReducer(extraDependenciesMock);

const initStore = (state: any) =>
    configureMockStore({
        reducer: {
            wallet: combineReducers({
                settings: settingsReducer,
            }),
        },
        preloadedState: { wallet: { settings: state } },
    });

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

describe('walletSettings Actions', () => {
    walletSettingsFixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.initialState);
            await store.dispatch(f.action() as any);
            expect(store.getState().wallet.settings).toMatchObject(f.result);
        });
    });
});
