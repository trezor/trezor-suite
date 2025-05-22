import { combineReducers } from '@reduxjs/toolkit';

import { ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account, WalletSettings } from '@suite-common/wallet-types';

import { prepareWalletSettingsReducer } from '../../settings/walletSettingsReducer';
import { AccountsRootState, prepareAccountsReducer } from '../accountsReducer';
import { disableAccountsThunk } from '../accountsThunks';

const accountsReducer = prepareAccountsReducer(extraDependenciesMock);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependenciesMock);

interface InitStoreArgs {
    extra?: ExtraDependenciesPartial;
    preloadedState?: AccountsRootState & { wallet: { settings: Partial<WalletSettings> } };
}

const initStore = ({ extra = {}, preloadedState }: InitStoreArgs = {}) =>
    configureMockStore({
        extra,
        reducer: {
            wallet: combineReducers({ accounts: accountsReducer, settings: walletSettingsReducer }),
        },
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
                    settings: {
                        enabledNetworks: ['ltc'],
                    },
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
                    settings: {
                        enabledNetworks: ['ltc'],
                    },
                },
            },
        });
        await store.dispatch(disableAccountsThunk());
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });
});
