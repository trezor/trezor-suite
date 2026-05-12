import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
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

export const selectAssetTabOfAccountToken = (
    state: TokensRootState,
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

    if (networkType !== 'cardano' || isCardanoSendEnabled) return true;

    return false;
};
