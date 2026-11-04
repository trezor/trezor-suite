import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    getWrappedNativeYieldVaults,
    selectBestEnabledYieldVault,
} from '@suite-common/earn-stablecoin';
import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import { isArrayMember } from '@trezor/utils';

import { useMessageSystemStaking } from './useMessageSystemStaking';
import { useMessageSystemYield } from './useMessageSystemYield';
import { useStakingRate } from './useStakingRate';
import {
    type YieldRateLabelType,
    getStakingRateLabelType,
    getYieldRateLabelType,
} from '../utils/getYieldRateLabelType';
import { getBestPromotedRate } from '../utils/promotedRateUtils';

/** `inactive` = token eligible for a deposit, `active` = vault receipt token already earning. */
export type TokenYieldRateVariant = 'inactive' | 'active';

export type TokenYieldRateToken = {
    contract: string;
    symbol?: string;
    decimals: number;
};

type UseAssetYieldRateParams = {
    networkSymbol: NetworkSymbol;
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
    stakingSymbols: readonly NetworkSymbol[];
    accountKey?: AccountKey;
};

export type AssetYieldRate = {
    apy: number;
    labelType: YieldRateLabelType;
};

const emptyVaults: YieldDtoV2[] = [];

export const useAssetYieldRate = ({
    networkSymbol,
    token,
    variant,
    stakingSymbols,
    accountKey,
}: UseAssetYieldRateParams): AssetYieldRate | null => {
    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldRateRelevant =
        getNetworkType(networkSymbol) === 'ethereum' && !yieldDepositMessageSystem.isDisabled;

    const { data: vaults } = useAllYieldOpportunities({ enabled: isYieldRateRelevant });

    const matchedVaults = useMemo(() => {
        if (!isYieldRateRelevant) {
            return emptyVaults;
        }

        if (token === undefined) {
            return getWrappedNativeYieldVaults({ vaults, networkSymbol });
        }

        const heldToken = {
            address: token.contract,
            symbol: token.symbol ?? '',
            decimals: token.decimals,
        };

        if (variant === 'active') {
            const vault = getYieldVaultForOutputToken({
                vaults,
                networkSymbol,
                token: heldToken,
            });

            return vault ? [vault] : emptyVaults;
        }

        return getYieldVaultsForInputToken({ vaults, networkSymbol, token: heldToken });
    }, [isYieldRateRelevant, vaults, networkSymbol, token, variant]);

    const bestVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(state, matchedVaults),
    );

    const { isStakingDisabled } = useMessageSystemStaking(networkSymbol);
    const { rate: stakingRate } = useStakingRate({ symbol: networkSymbol, accountKey });
    const promotedStakingRate =
        token === undefined && !isStakingDisabled && isArrayMember(networkSymbol, stakingSymbols)
            ? stakingRate
            : null;

    return useMemo(() => {
        const vaultApy = bestVault ? getApyPercent(bestVault.rewardRate.total) : null;
        const bestRate = getBestPromotedRate({ vaultApy, stakingRate: promotedStakingRate });

        if (!bestRate) {
            return null;
        }

        if (bestRate.isVaultRate && bestVault) {
            return { apy: bestRate.apy, labelType: getYieldRateLabelType(bestVault.rewardRate) };
        }

        return { apy: bestRate.apy, labelType: getStakingRateLabelType(networkSymbol) };
    }, [bestVault, promotedStakingRate, networkSymbol]);
};
