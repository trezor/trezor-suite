import { useYieldVaultApy } from '@suite-common/earn-stablecoin';
import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';

import { YieldBadge } from '../../../components/earn/YieldBadge/YieldBadge';
import { useStakingRate } from '../../../hooks/earn/useStakingRate';

type HomeAssetApyBadgeProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
};

export const HomeAssetApyBadge = (props: HomeAssetApyBadgeProps) => {
    const isToken = props.contractAddress !== undefined;
    const vaultApy = useYieldVaultApy(props);
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
