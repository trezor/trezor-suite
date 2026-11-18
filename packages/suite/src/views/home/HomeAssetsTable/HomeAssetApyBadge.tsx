import { useYieldVaultApy } from '@suite-common/earn-stablecoin';
import {
    selectIsStakingOperationDisabled,
    selectIsStakingPromotedSymbol,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';

import { YieldBadge } from '#src/components/earn/YieldBadge/YieldBadge';
import { useSelector } from '#src/hooks/suite/useSelector';

type HomeAssetApyBadgeProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
};

export const HomeAssetApyBadge = (props: HomeAssetApyBadgeProps) => {
    const isToken = props.contractAddress !== undefined;
    const vaultApy = useYieldVaultApy(props);

    // A row advertises mainnet products only, and none whose stake is switched off.
    const isStakingAdvertised = useSelector(state => {
        if (isToken || !selectIsStakingPromotedSymbol(state, props.symbol, 'offered')) {
            return false;
        }

        const productId = selectStakeableStakingProductDescriptorBySymbol(state, props.symbol)?.id;

        return (
            productId !== undefined && !selectIsStakingOperationDisabled(state, productId, 'stake')
        );
    });

    const { rate: stakingApy } = useNetworkStakingRate({
        networkSymbol: isStakingAdvertised ? props.symbol : null,
    });

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
