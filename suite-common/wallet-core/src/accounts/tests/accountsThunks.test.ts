import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';
import { ExtraDependenciesPartial } from '@suite-common/redux-utils';

import { disableAccountsThunk } from '../accountsThunks';
import { AccountsRootState, prepareAccountsReducer } from '../accountsReducer';

const accountsReducer = prepareAccountsReducer(extraDependenciesMock);

interface InitStoreArgs {
    extra?: ExtraDependenciesPartial;
    preloadedState?: AccountsRootState;
}

const initStore = ({ extra = {}, preloadedState }: InitStoreArgs = {}) =>
    configureMockStore({
        extra,
        reducer: { wallet: combineReducers({ accounts: accountsReducer }) },
        preloadedState,
    });

const getAccount = (a?: Partial<Account>) => ({
    descriptor: 'xpubDeFauLT1',
    symbol: 'btc',
    ...a,
});

describe('Account Actions', () => {
    it('Disable accounts (all removed)', async () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    accounts: [getAccount() as Account, getAccount() as Account],
                },
            },
            extra: {
                selectors: {
                    selectEnabledNetworks: () => ['ltc'],
                },
            },
        });
        await store.dispatch(disableAccountsThunk());
        expect(store.getState().wallet.accounts.length).toEqual(0);
    });

    it('Disable accounts (not all removed)', async () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    accounts: [getAccount({ symbol: 'ltc' }) as Account, getAccount() as Account],
                },
            },
            extra: {
                selectors: {
                    selectEnabledNetworks: () => ['ltc'],
                },
            },
        });
        await store.dispatch(disableAccountsThunk());
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });
});
