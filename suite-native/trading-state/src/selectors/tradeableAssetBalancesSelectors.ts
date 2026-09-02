import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { aggregateTradeableAssetBalances } from '@suite-common/trading';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';

type TradeableAssetBalancesRootState = AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createTradeableAssetBalancesSelector =
    createWeakMapSelector.withTypes<TradeableAssetBalancesRootState>();

export const selectTradeableAssetBalances = createTradeableAssetBalancesSelector(
    [selectVisibleDeviceAccounts, selectCurrentFiatRates, selectBaseCurrency],
    (accounts, fiatRates, baseCurrency) =>
        aggregateTradeableAssetBalances({ accounts, fiatRates, baseCurrency }),
);
