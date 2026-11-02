import { selectIsDebugModeActive } from '@suite/debug';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId, isAccountEligibleForTrade, isSellableAccount } from '@suite-common/trading';
import {
    type AssetAccount,
    selectAccounts,
    selectDeviceAssetAccounts,
    selectVisibleDeviceAccountsMap,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { filterReceiveAccounts, isPositiveBalance } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type AppState } from 'src/types/suite';
import { selectRoutedAssetKey } from 'src/views/home/AssetDetail/selectRoutedAssetKey';

type RoutedAssetTradeAccountKeys = {
    buy: AccountKey | undefined;
    sell: AccountKey | undefined;
};

type SellableAssetAccount = {
    assetAccount: AssetAccount;
    account: Account;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

export const selectRoutedAssetTradeAccountKeys = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        selectAccounts,
        selectVisibleDeviceAccountsMap,
        selectSupportedNetworkSymbols,
        selectDeviceStaticSessionId,
        selectIsDebugModeActive,
        selectTokenDefinitions,
        selectRoutedAssetKey,
    ],
    (
        assetAccounts,
        accounts,
        accountsByKey,
        supportedNetworks,
        deviceState,
        isDebug,
        tokenDefinitions,
        assetKey,
    ): RoutedAssetTradeAccountKeys => {
        const routedAssetAccounts = assetAccounts.filter(
            assetAccount => assetAccount.assetKey === assetKey,
        );
        const networkSymbol = routedAssetAccounts[0]?.symbol;

        const [buyAccount] =
            networkSymbol === undefined
                ? []
                : filterReceiveAccounts({
                      accounts,
                      supportedNetworks,
                      deviceState: deviceState ?? undefined,
                      symbol: networkSymbol,
                      isDebug,
                  });

        const sellableAssetAccounts = routedAssetAccounts.flatMap(
            (assetAccount): SellableAssetAccount[] => {
                const account = accountsByKey.get(assetAccount.accountKey);

                return account !== undefined && isSellableAccount(account)
                    ? [{ assetAccount, account }]
                    : [];
            },
        );
        const canSell = ({ assetAccount, account }: SellableAssetAccount) =>
            assetAccount.contractAddress === undefined
                ? isPositiveBalance(account.balance)
                : isAccountEligibleForTrade(
                      account,
                      'sell',
                      tokenDefinitions,
                      getCryptoId(assetAccount.symbol, assetAccount.contractAddress),
                  );

        return {
            buy: buyAccount?.key,
            sell: sellableAssetAccounts.find(canSell)?.account.key,
        };
    },
);
