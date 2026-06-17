import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    AUTO_STAKED_SYMBOLS,
    selectApy,
    selectRewardsBalanceByAccountKey,
    selectTronVotesByAccountKey,
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

    const apy = useNativeStakingSelector(state =>
        selectApy(state, { accountKey, networkSymbol: symbol ?? undefined }),
    );

    const { stats: tronStats, formattedMaxApr: tronMaxApr } = useTronStakingStats({
        enabled: symbol === 'trx',
    });

    const tronVotes = useNativeStakingSelector(state =>
        selectTronVotesByAccountKey(state, accountKey),
    );

    const votedTronApr = getTronVotedApr(
        tronStats.data,
        tronVotes.map(({ address }) => address),
    );

    const tronApr = formatTronApr(votedTronApr ?? tronMaxApr);

    const rewardsBalance = useNativeStakingSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const isAutoStaked = AUTO_STAKED_SYMBOLS.includes(symbol);
    const apyValue = symbol === 'trx' ? tronApr : apy;

    return isAutoStaked ? (
        <AutoStakedBalancesCard
            accountKey={accountKey}
            symbol={symbol}
            rewardsBalance={rewardsBalance}
            apy={apyValue}
            handleToggleBottomSheet={handleToggleBottomSheet}
        />
    ) : (
        <ManualStakedBalancesCard
            accountKey={accountKey}
            symbol={symbol}
            rewardsBalance={rewardsBalance}
            apy={apyValue}
            handleToggleBottomSheet={handleToggleBottomSheet}
        />
    );
};
