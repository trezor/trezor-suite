import { useMemo } from 'react';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId, isWrappedNativeToken } from '@suite-common/wallet-config';
import { isYieldVaultOperational } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import {
    getBestEnabledYieldVault,
    isYieldVaultDepositEnabled,
} from 'src/components/earn/utils/yieldVaultUtils';
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
    const {
        data: availableVaults,
        isSuccess: hasLoadedVaults,
        isError: hasVaultsError,
    } = useAllYieldOpportunities({ enabled: isYieldOptionRelevant });

    const wrappedNativeVaults = useMemo(
        () =>
            isYieldOptionRelevant
                ? (availableVaults ?? emptyVaults).filter(
                      vault =>
                          isYieldVaultOperational(vault) &&
                          vault.status.enter &&
                          getNetworkByYieldXyzId(vault.network)?.symbol === account.symbol &&
                          isWrappedNativeToken(account.symbol, vault.token.address),
                  )
                : emptyVaults,
        [isYieldOptionRelevant, availableVaults, account.symbol],
    );

    const hasYieldOption = useSelector(state =>
        wrappedNativeVaults.some(vault => isYieldVaultDepositEnabled(state, vault)),
    );
    const bestVault = useSelector(state => getBestEnabledYieldVault(state, wrappedNativeVaults));

    // Hold rendering until the vaults query settles so dependent UI does not flash
    // from a yield-less to a yield-aware variant underneath the user.
    const isResolving = isYieldOptionRelevant && !hasLoadedVaults && !hasVaultsError;

    return {
        isResolving,
        hasYieldOption,
        bestVaultApy: bestVault ? getApyPercent(bestVault.rewardRate.total) : null,
        bestVaultId: bestVault?.id ?? null,
    };
};
