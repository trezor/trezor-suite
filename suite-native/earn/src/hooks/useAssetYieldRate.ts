import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    getWrappedNativeYieldVaults,
    selectBestEnabledYieldVault,
} from '@suite-common/earn-stablecoin';
import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    type StakingAccessRootState,
    selectIsStakingManageableSymbol,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
    useStakingAccess,
} from '@suite-common/earn-staking';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { useMessageSystemYield } from './useMessageSystemYield';
import { type YieldRateLabelType, getYieldRateLabelType } from '../utils/getYieldRateLabelType';
import { getBestPromotedRate } from '../utils/promotedRateUtils';

/** `inactive` = token eligible for a deposit, `active` = vault receipt token already earning. */
export type TokenYieldRateVariant = 'inactive' | 'active';

/** `offered` = every staking product the platform shows, `manageable` = only what it can stake. */
export type StakingPromotionScope = 'offered' | 'manageable';

export type TokenYieldRateToken = {
    contract: string;
    symbol?: string;
    decimals: number;
};

type UseAssetYieldRateParams = {
    networkSymbol: NetworkSymbol;
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
    stakingScope: StakingPromotionScope;
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
    stakingScope,
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

    const stakingProductId = useSelector(
        (state: StakingAccessRootState) =>
            selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol)?.id ?? null,
    );
    const isStakingPromoted = useSelector((state: StakingAccessRootState) =>
        stakingScope === 'manageable'
            ? selectIsStakingManageableSymbol(state, networkSymbol)
            : selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol) !== null,
    );
    const { disabled } = useStakingAccess(stakingProductId);
    const { rate: stakingRate, rateKind } = useNetworkStakingRate({ networkSymbol, accountKey });
    const promotedStakingRate =
        token === undefined && isStakingPromoted && disabled.stake === undefined
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

        return { apy: bestRate.apy, labelType: rateKind ?? 'rate' };
    }, [bestVault, promotedStakingRate, rateKind]);
};
