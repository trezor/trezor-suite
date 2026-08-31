import { useMemo } from 'react';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemRootState,
    selectIsYieldFeatureDisabled,
} from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent, isApyAvailable } from '@suite-common/wallet-utils';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

const emptyVaults: YieldDtoV2[] = [];

// Each vault can be remotely killed on its own via the message system — a killed vault
// must not be advertised.
const isVaultDepositEnabled = (state: MessageSystemRootState, vault: YieldDtoV2) =>
    !selectIsYieldFeatureDisabled(
        state,
        Feature.earn.yield.deposit,
        getYieldVaultContractAddress(vault),
    );

export const useEarnEthBanner = (account: Account) => {
    const { rate: stakingRate } = useStakingRate({
        symbol: account.symbol,
        accountKey: account.key,
    });

    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldOptionRelevant =
        account.networkType === 'ethereum' && !yieldDepositMessageSystem.isDisabled;
    const {
        data: availableVaults,
        isSuccess: hasLoadedVaults,
        isError: hasVaultsError,
    } = useAllYieldOpportunities({ enabled: isYieldOptionRelevant });

    // The native coin can also earn yield via a wrapped-native vault — promote both options.
    const wrappedNativeVaults = useMemo(
        () =>
            isYieldOptionRelevant
                ? (availableVaults ?? emptyVaults).filter(
                      vault =>
                          !vault.metadata.underMaintenance &&
                          !vault.metadata.deprecated &&
                          getNetworkByYieldXyzId(vault.network)?.symbol === account.symbol &&
                          isWrappedNativeToken(account.symbol, vault.token.address),
                  )
                : emptyVaults,
        [isYieldOptionRelevant, availableVaults, account.symbol],
    );

    const hasYieldOption = useSelector(state =>
        wrappedNativeVaults.some(vault => isVaultDepositEnabled(state, vault)),
    );
    const bestVaultApy = useSelector(state => {
        const enabledVaultApys = wrappedNativeVaults
            .filter(vault => isVaultDepositEnabled(state, vault))
            .map(vault => getApyPercent(vault.rewardRate.total))
            .filter((vaultApy): vaultApy is number => isApyAvailable(vaultApy));

        return enabledVaultApys.length > 0 ? Math.max(...enabledVaultApys) : null;
    });

    // Hold rendering until the vaults query settles so the banner variant does not
    // flash from staking-only to staking+yield underneath the user.
    const isResolving = isYieldOptionRelevant && !hasLoadedVaults && !hasVaultsError;

    const apyCandidates = [stakingRate, bestVaultApy].filter(
        (apyCandidate): apyCandidate is number => isApyAvailable(apyCandidate),
    );
    const apy = apyCandidates.length > 0 ? Math.max(...apyCandidates) : null;

    return { isResolving, hasYieldOption, apy };
};
