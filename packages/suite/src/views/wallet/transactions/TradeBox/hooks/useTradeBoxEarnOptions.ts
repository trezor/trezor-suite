import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { selectIsStakingSupportedSymbol, useNetworkStakingRate } from '@suite-common/earn-staking';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

type TradeBoxYieldBadge = {
    rate: number;
    rateKind: StakingRateKind;
    vaultId?: string;
};

type TradeBoxEarnOptions = {
    hasEarnOption: boolean;
    yieldBadge: TradeBoxYieldBadge | null;
};

export const useTradeBoxEarnOptions = (account: Account): TradeBoxEarnOptions => {
    const { hasYieldOption, bestVault } = useNativeYieldVault({ account });

    const isStakingSupported = useSelector(state =>
        selectIsStakingSupportedSymbol(state, account.symbol),
    );

    const { rate: stakingRate, rateKind } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const hasApy = isApyAvailable(bestVault?.apy) || isApyAvailable(stakingRate);

    const yieldBadge = hasApy
        ? {
              rate: Math.max(bestVault?.apy ?? 0, stakingRate ?? 0),
              rateKind: rateKind ?? 'apy',
              vaultId: bestVault?.id,
          }
        : null;

    return {
        hasEarnOption: isStakingSupported || hasYieldOption,
        yieldBadge,
    };
};
