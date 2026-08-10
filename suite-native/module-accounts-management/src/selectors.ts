import { type AccountItem } from '@suite-common/graph';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
    selectAccountManuallyHiddenTokens,
    selectAccountUnrecognizedTokens,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { type TokensRootState } from '@suite-native/tokens';
import { deepEqual } from '@trezor/utils';

import { type AccountAssetsTab } from './components/AccountAssets/types';

const createAccountsMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

export const selectAccountItemForGraph = createAccountsMemoizedSelector(
    [
        selectAccountByKey,
        (_state: AccountsRootState, _accountKey: AccountKey, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (account, tokenContract): AccountItem | undefined => {
        if (!account) return undefined;

        return {
            symbol: account.symbol,
            descriptor: account.descriptor,
            accountKey: account.key,
            identity: tryGetAccountIdentity(account),
            hideMainAccount: !!tokenContract,
            // Pass empty array to show only the main account, or the token to show only its graph.
            tokensFilter: tokenContract ? [tokenContract] : [],
        };
    },
    {
        memoizeOptions: {
            // Account objects churn on every blockchain sync, but the graph fetch input uses
            // only stable account identity fields. Keep the same object ref when they are equal.
            resultEqualityCheck: deepEqual,
        },
    },
);

export const selectAssetTabOfAccountToken = (
    state: TokensRootState & FiatRatesRootState & WalletSettingsRootState,
    accountKey: AccountKey,
    tokenContract: TokenAddress,
): AccountAssetsTab => {
    const lcContract = tokenContract.toLowerCase();

    const defiTokens = selectAccountDefiTokens(state, accountKey);
    if (defiTokens.some(t => t.contract.toLowerCase() === lcContract)) return 'defi';

    const hiddenTokens = selectAccountManuallyHiddenTokens(state, accountKey);
    const unrecognizedTokens = selectAccountUnrecognizedTokens(state, accountKey);
    if ([...hiddenTokens, ...unrecognizedTokens].some(t => t.contract.toLowerCase() === lcContract))
        return 'hidden';

    return 'tokens';
};

export const selectIsNetworkSendFlowEnabled = (
    state: FeatureFlagsRootState,
    symbol?: NetworkSymbol,
) => {
    if (!symbol) return false;
    const networkType = getNetworkType(symbol);

    const isCardanoSendEnabled = selectIsFeatureFlagEnabled(
        state,
        FeatureFlag.IsCardanoSendEnabled,
    );

    return networkType !== 'cardano' || isCardanoSendEnabled;
};
