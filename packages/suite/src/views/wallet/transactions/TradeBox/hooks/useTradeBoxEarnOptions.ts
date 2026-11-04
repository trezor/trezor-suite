import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { type Account } from '@suite-common/wallet-types';
import { hasNetworkFeatures, isApyAvailable } from '@suite-common/wallet-utils';

import { useStakingRate } from '#src/hooks/earn/useStakingRate';

type TradeBoxYieldBadge = {
    apy: number;
    vaultId?: string;
};

type TradeBoxEarnOptions = {
    hasEarnOption: boolean;
    yieldBadge: TradeBoxYieldBadge | null;
};

export const useTradeBoxEarnOptions = (account: Account): TradeBoxEarnOptions => {
    const { hasYieldOption, bestVault } = useNativeYieldVault({ account });
    const { rate: stakingRate } = useStakingRate({
        symbol: account.symbol,
        accountKey: account.key,
    });

    const hasApy = isApyAvailable(bestVault?.apy) || isApyAvailable(stakingRate);

    const yieldBadge = hasApy
        ? {
              apy: Math.max(bestVault?.apy ?? 0, stakingRate ?? 0),
              vaultId: bestVault?.id,
          }
        : null;

    return {
        hasEarnOption: hasNetworkFeatures(account, 'staking') || hasYieldOption,
        yieldBadge,
    };
};
