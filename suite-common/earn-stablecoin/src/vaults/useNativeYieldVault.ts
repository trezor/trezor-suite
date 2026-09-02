import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemRootState,
    selectIsYieldFeatureDisabled,
} from '@suite-common/message-system';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { getWrappedNativeYieldVaults } from './getWrappedNativeYieldVaults';
import {
    selectBestEnabledYieldVault,
    selectIsYieldVaultDepositEnabled,
} from './yieldVaultSelectors';

interface UseNativeYieldVaultProps {
    account?: Account;
}

export const useNativeYieldVault = ({ account }: UseNativeYieldVaultProps) => {
    // Only the feature flag matters here, so this reads the selector directly rather than going
    // through `useMessageSystemYield`, whose message content needs a platform-specific locale.
    const isYieldDepositDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsYieldFeatureDisabled(state, Feature.earn.yield.deposit),
    );
    const isYieldOptionRelevant = account?.networkType === 'ethereum' && !isYieldDepositDisabled;

    const { data: availableVaults } = useAllYieldOpportunities({
        enabled: isYieldOptionRelevant,
    });

    const networkSymbol = account?.symbol;

    const wrappedNativeVaults = useMemo(
        () =>
            isYieldOptionRelevant && networkSymbol !== undefined
                ? getWrappedNativeYieldVaults({
                      vaults: availableVaults,
                      networkSymbol,
                  })
                : [],
        [availableVaults, isYieldOptionRelevant, networkSymbol],
    );

    const hasYieldOption = useSelector((state: MessageSystemRootState) =>
        wrappedNativeVaults.some(vault => selectIsYieldVaultDepositEnabled(state, vault)),
    );

    const bestEnabledVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(state, wrappedNativeVaults),
    );

    const bestVaultApy = bestEnabledVault ? getApyPercent(bestEnabledVault.rewardRate.total) : null;

    const bestVault =
        bestEnabledVault && bestVaultApy !== null
            ? { id: bestEnabledVault.id, apy: bestVaultApy }
            : null;

    return { hasYieldOption, bestVault };
};
