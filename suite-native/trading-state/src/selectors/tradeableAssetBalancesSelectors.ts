import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
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

type TradeableAssetBalancesRootState = NetworksRootState &
    AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

export const selectTradeableAssetBalances =
    createWeakMapSelector.withTypes<TradeableAssetBalancesRootState>()(
        [
            selectNetworkConfigAccessors,
            selectVisibleDeviceAccounts,
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
