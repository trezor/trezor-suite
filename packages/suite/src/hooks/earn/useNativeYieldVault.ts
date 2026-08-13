import { useMemo } from 'react';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    getWrappedNativeYieldVaults,
    selectBestEnabledYieldVault,
    selectIsYieldVaultDepositEnabled,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

const emptyVaults: YieldDtoV2[] = [];

/**
 * Yield options for an account's native coin — deposit-open vaults taking the
 * wrapped-native token (the native balance can be wrapped on the way into the vault).
 */
export const useNativeYieldVault = (account: Account) => {
    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldOptionRelevant =
        account.networkType === 'ethereum' && !yieldDepositMessageSystem.isDisabled;
    const { data: availableVaults } = useAllYieldOpportunities({
        enabled: isYieldOptionRelevant,
    });

    const wrappedNativeVaults = useMemo(
        () =>
            isYieldOptionRelevant
                ? getWrappedNativeYieldVaults({
                      vaults: availableVaults,
                      networkSymbol: account.symbol,
                  })
                : emptyVaults,
        [isYieldOptionRelevant, availableVaults, account.symbol],
    );

    const hasYieldOption = useSelector(state =>
        wrappedNativeVaults.some(vault => selectIsYieldVaultDepositEnabled(state, vault)),
    );
    const bestVault = useSelector(state => selectBestEnabledYieldVault(state, wrappedNativeVaults));
    const bestVaultApy = bestVault ? getApyPercent(bestVault.rewardRate.total) : null;

    return {
        hasYieldOption,
        bestVault:
            bestVault && bestVaultApy !== null ? { id: bestVault.id, apy: bestVaultApy } : null,
    };
};
