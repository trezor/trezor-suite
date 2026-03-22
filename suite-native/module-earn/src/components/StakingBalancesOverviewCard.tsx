import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    AUTO_STAKED_SYMBOLS,
    selectAPYByAccountKey,
    selectRewardsBalanceByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';

import { AutoStakedBalancesCard } from './AutoStakedBalancesCard';
import { ManualStakedBalancesCard } from './ManualStakedBalancesCard';

type StakingBalancesCardProps = {
    accountKey: AccountKey;
    handleToggleBottomSheet: (value: boolean) => void;
};

export const StakingBalancesOverviewCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakingBalancesCardProps) => {
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));

    const rewardsBalance = useNativeStakingSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const isAutoStaked = AUTO_STAKED_SYMBOLS.includes(symbol);

    return isAutoStaked ? (
        <AutoStakedBalancesCard
            accountKey={accountKey}
            symbol={symbol}
            rewardsBalance={rewardsBalance}
            apy={apy}
            handleToggleBottomSheet={handleToggleBottomSheet}
        />
    ) : (
        <ManualStakedBalancesCard
            accountKey={accountKey}
            symbol={symbol}
            rewardsBalance={rewardsBalance}
            apy={apy}
            handleToggleBottomSheet={handleToggleBottomSheet}
        />
    );
};
