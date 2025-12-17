import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import {
    AUTO_STAKED_SYMBOLS,
    NativeStakingRootState,
    selectAPYByAccountKey,
    selectRewardsBalanceByAccountKey,
} from '@suite-native/staking';

import { AutoStakedBalancesCard } from './AutoStakedBalancesCard';
import { ManualStakedBalancesCard } from './ManualStakedBalancesCard';

type StakingBalancesCardProps = {
    accountKey: string;
    handleToggleBottomSheet: (value: boolean) => void;
};

export const StakingBalancesOverviewCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakingBalancesCardProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const apy = useSelector((state: NativeStakingRootState) =>
        selectAPYByAccountKey(state, accountKey),
    );

    const rewardsBalance = useSelector((state: NativeStakingRootState) =>
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
