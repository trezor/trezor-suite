import { useSelector } from 'react-redux';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemRootState,
    selectIsYieldFeatureDisabled,
} from '@suite-common/message-system';
import { getNetworkByYieldXyzId, isWrappedNativeToken } from '@suite-common/wallet-config';
import { getYieldVaultContractAddress, isYieldVaultOperational } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { useMessageSystemYield } from './useMessageSystemYield';
import { selectBestEnabledYieldVault } from '../selectors';

const emptyVaults: YieldDtoV2[] = [];

interface UseNativeYieldVaultProps {
    account?: Account;
}

export const useNativeYieldVault = ({ account }: UseNativeYieldVaultProps) => {
    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldOptionRelevant =
        account?.networkType === 'ethereum' && !yieldDepositMessageSystem.isDisabled;

    const { data: availableVaults } = useAllYieldOpportunities({
        enabled: isYieldOptionRelevant,
    });

    const wrappedNativeVaults = isYieldOptionRelevant
        ? (availableVaults ?? emptyVaults).filter(
              vault =>
                  isYieldVaultOperational(vault) &&
                  vault.status.enter &&
                  getNetworkByYieldXyzId(vault.network)?.symbol === account.symbol &&
                  isWrappedNativeToken(account.symbol, vault.token.address),
          )
        : emptyVaults;

    const hasYieldOption = useSelector((state: MessageSystemRootState) =>
        wrappedNativeVaults.some(
            vault =>
                !selectIsYieldFeatureDisabled(
                    state,
                    Feature.earn.yield.deposit,
                    getYieldVaultContractAddress(vault),
                ),
        ),
    );

    const bestVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(state, wrappedNativeVaults),
    );

    const bestVaultApy = bestVault ? getApyPercent(bestVault.rewardRate.total) : null;

    return {
        hasYieldOption,
        bestVault:
            bestVault && bestVaultApy !== null ? { id: bestVault.id, apy: bestVaultApy } : null,
    };
};
