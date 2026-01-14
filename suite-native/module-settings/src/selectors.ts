import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    AccountsRootState,
    WalletSettingsRootState,
    selectAccountsSymbols,
    selectIsBitcoinEnabled,
} from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    WalletSettingsRootState & AccountsRootState
>();

export const selectIsBitcoinBackendsConfigVisible = createMemoizedSelector(
    [selectIsBitcoinEnabled, selectAccountsSymbols],
    (isBitcoinEnabled, accountsSymbols) => isBitcoinEnabled || accountsSymbols.includes('btc'),
);
