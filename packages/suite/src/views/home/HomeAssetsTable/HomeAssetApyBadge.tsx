import { useMemo } from 'react';

import {
    getWrappedNativeYieldVaults,
    selectBestEnabledYieldVault,
} from '@suite-common/earn-stablecoin';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { Feature, selectIsYieldFeatureDisabled } from '@suite-common/message-system';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { getYieldVaultsForInputToken } from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent, isApyAvailable } from '@suite-common/wallet-utils';

import { YieldBadge } from 'src/components/earn/YieldBadge/YieldBadge';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useSelector } from 'src/hooks/suite';

type HomeAssetApyBadgeProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
};

const useVaultApy = ({
    symbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
}: HomeAssetApyBadgeProps) => {
    const isDepositDisabled = useSelector(state =>
        selectIsYieldFeatureDisabled(state, Feature.earn.yield.deposit),
    );
    const { data: vaults } = useAllYieldOpportunities({
        enabled: getNetworkType(symbol) === 'ethereum' && !isDepositDisabled,
    });
    const assetVaults = useMemo(
        () =>
            contractAddress === undefined
                ? getWrappedNativeYieldVaults({ vaults, networkSymbol: symbol })
                : getYieldVaultsForInputToken({
                      vaults,
                      networkSymbol: symbol,
                      token: {
                          address: contractAddress,
                          symbol: tokenSymbol ?? '',
                          decimals: tokenDecimals ?? 0,
                      },
                  }),
        [vaults, symbol, contractAddress, tokenSymbol, tokenDecimals],
    );
    const bestVault = useSelector(state => selectBestEnabledYieldVault(state, assetVaults));

    return bestVault === null ? null : getApyPercent(bestVault.rewardRate.total);
};

export const HomeAssetApyBadge = (props: HomeAssetApyBadgeProps) => {
    const isToken = props.contractAddress !== undefined;
    const vaultApy = useVaultApy(props);
    const { rate: stakingRate } = useStakingRate({ symbol: props.symbol });
    const stakingApy = isToken ? null : stakingRate;

    const apy = Math.max(
        ...[vaultApy, stakingApy].filter((rate): rate is number => isApyAvailable(rate)),
    );

    if (!isApyAvailable(apy)) {
        return null;
    }

    // A Home row stands for every account holding the asset, so whether one of them already
    // earns this rate is not known here: the badge is always the offer, as on the token list.
    return <YieldBadge apy={apy} variant="inactive" />;
};
