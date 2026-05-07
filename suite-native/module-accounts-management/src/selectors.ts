import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
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
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { type TokensRootState } from '@suite-native/tokens';

import { type AccountAssetsTab } from './components/AccountAssets/types';

export const selectIsUnrecognizedToken = (
    state: TokenDefinitionsRootState & AccountsRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => {
    if (!tokenContract) return false;
    const account = selectAccountByKey(state, accountKey);
    if (!account) return false;

    return !selectIsSpecificCoinDefinitionKnown(state, account.symbol, tokenContract);
};

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
