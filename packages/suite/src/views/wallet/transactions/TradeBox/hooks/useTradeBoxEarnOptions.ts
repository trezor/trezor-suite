import { hasNetworkFeatures, isApyAvailable } from '@suite-common/wallet-utils';

import { useNativeYieldVault } from 'src/hooks/earn/useNativeYieldVault';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { type Account } from 'src/types/wallet';

type TradeBoxYieldBadge = {
    apy: number;
    vaultId: string;
};

type TradeBoxEarnOptions = {
    hasEarnOption: boolean;
    yieldBadge: TradeBoxYieldBadge | null;
};

export const useTradeBoxEarnOptions = (account: Account): TradeBoxEarnOptions => {
    const { hasYieldOption, bestVault } = useNativeYieldVault(account);
    const { rate: stakingRate } = useStakingRate({
        symbol: account.symbol,
        accountKey: account.key,
    });

    // The token list badges advertise a single vault, while the trade box teases every way
    // to earn on the account — so it shows the better of the vault and staking rates.
    const yieldBadge = bestVault
        ? {
              apy:
                  stakingRate !== null && isApyAvailable(stakingRate)
                      ? Math.max(bestVault.apy, stakingRate)
                      : bestVault.apy,
              vaultId: bestVault.id,
          }
        : null;

    return {
        hasEarnOption: hasNetworkFeatures(account, 'staking') || hasYieldOption,
        yieldBadge,
    };
};
