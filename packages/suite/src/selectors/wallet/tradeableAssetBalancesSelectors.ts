import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { aggregateTradeableAssetBalances } from '@suite-common/trading';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';

type TradeableAssetBalancesRootState = AccountsRootState &
    NetworksRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createTradeableAssetBalancesSelector =
    createWeakMapSelector.withTypes<TradeableAssetBalancesRootState>();

export const selectTradeableAssetBalances = createTradeableAssetBalancesSelector(
    [selectAllAccountsToList, selectCurrentFiatRates, selectBaseCurrency],
    (accounts, fiatRates, baseCurrency) =>
        aggregateTradeableAssetBalances({ accounts, fiatRates, baseCurrency }),
);
