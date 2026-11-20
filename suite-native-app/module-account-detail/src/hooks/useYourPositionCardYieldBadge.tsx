import { useSelector } from 'react-redux';

import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    type StakingAccessRootState,
    selectIsStakingPromotedSymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { type TokenInfoBranded } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { getBestPromotedRate, useYieldBadge } from '@suite-native/earn';

interface UseYourPositionCardYieldBadgeProps {
    account: Account;
    token: TokenInfoBranded | null;
}

export const useYourPositionCardYieldBadge = ({
    account,
    token,
}: UseYourPositionCardYieldBadgeProps) => {
    const { data: yieldOpportunities } = useAllYieldOpportunities();

    const nativeYieldVault = useNativeYieldVault({ account });

    const { rate: stakingRate } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });
    const isStakingPromoted = useSelector((state: StakingAccessRootState) =>
        selectIsStakingPromotedSymbol(state, account.symbol, 'manageable'),
    );

    const bestPromotedRate = token
        ? null
        : getBestPromotedRate({
              vaultApy: nativeYieldVault.bestVault?.apy ?? null,
              stakingRate: isStakingPromoted ? stakingRate : null,
          });

    const promoYieldBadge = bestPromotedRate
        ? { apy: bestPromotedRate.apy, vaultId: nativeYieldVault.bestVault?.id ?? null }
        : null;

    const yieldBadge = useYieldBadge({
        networkSymbol: account.symbol,
        token: token ?? undefined,
        accountTokens: account.tokens,
        type: token && isErc4626(token) ? 'defi' : 'default',
        yieldOpportunities,
    });

    const usedYieldBadge = promoYieldBadge ?? yieldBadge;

    const usedYieldBadgeVariant = (() => {
        if (promoYieldBadge) return 'promo' as const;

        return yieldBadge?.hasVaultPosition ? ('active' as const) : ('inactive' as const);
    })();

    return { yieldBadge: usedYieldBadge, yieldBadgeVariant: usedYieldBadgeVariant };
};
