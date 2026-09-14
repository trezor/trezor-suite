import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
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

export const selectTradeableAssetBalances =
    createWeakMapSelector.withTypes<TradeableAssetBalancesRootState>()(
        [
            selectNetworkConfigAccessors,
            selectAllAccountsToList,
            selectCurrentFiatRates,
            selectBaseCurrency,
        ],
        (networkConfigDeps, accounts, fiatRates, baseCurrency) =>
            aggregateTradeableAssetBalances(networkConfigDeps, {
                accounts,
                fiatRates,
                baseCurrency,
            }),
    );
