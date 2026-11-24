import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { aggregateReceiveAssetBalances } from './receiveAssetBalances';

type ReceiveAssetBalancesRootState = AccountsRootState &
    NetworksRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;
const createReceiveAssetBalancesSelector =
    createWeakMapSelector.withTypes<ReceiveAssetBalancesRootState>();

export const selectReceiveAssetBalances = createReceiveAssetBalancesSelector(
    [selectAllAccountsToList, selectCurrentFiatRates, selectBaseCurrency],
    (accounts, fiatRates, baseCurrency) =>
        aggregateReceiveAssetBalances({ accounts, fiatRates, baseCurrency }),
);
