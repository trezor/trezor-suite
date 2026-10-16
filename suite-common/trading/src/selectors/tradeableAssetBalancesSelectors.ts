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

import { aggregateTradeableAssetBalances } from '../utils/tradeableAssetBalanceUtils';

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
