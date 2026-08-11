import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenInfoBranded } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import {
    getBestPromotedRate,
    isEarnPromoSymbol,
    useNativeYieldVault,
    useStakingRate,
    useYieldBadge,
} from '@suite-native/module-earn';

interface UseYourPositionCardYieldBadgeProps {
    account?: Account | null;
    token?: TokenInfoBranded | null;
    symbol?: NetworkSymbol | null;
}

export const useYourPositionCardYieldBadge = ({
    account,
    token,
    symbol,
}: UseYourPositionCardYieldBadgeProps) => {
    const { data: yieldOpportunities } = useAllYieldOpportunities();

    const nativeYieldVault = useNativeYieldVault({ account: account ?? undefined });

    const { rate: stakingRate } = useStakingRate({
        symbol: account?.symbol,
        accountKey: account?.key,
    });

    const bestPromotedRate = token
        ? null
        : getBestPromotedRate({
              vaultApy: nativeYieldVault.bestVault?.apy ?? null,
              stakingRate: isEarnPromoSymbol(account?.symbol) ? stakingRate : null,
          });

    const promoYieldBadge = bestPromotedRate
        ? { apy: bestPromotedRate.apy, vaultId: nativeYieldVault.bestVault?.id ?? null }
        : null;

    const yieldBadge = useYieldBadge({
        networkSymbol: symbol ?? undefined,
        token: token ?? undefined,
        accountTokens: account?.tokens,
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
