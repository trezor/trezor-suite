import { useSelector } from 'react-redux';

import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import {
    type StakeRootState,
    type TronStakeRootState,
    selectAccountNetworkSymbol,
    selectApy,
    selectRewardsBalanceByAccountKey,
    selectTronVotesByAccountKey,
    useAccountsSelector,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

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

    const apy = useSelector((state: StakeRootState) =>
        selectApy(state, { accountKey, networkSymbol: symbol ?? undefined }),
    );

    const { stats: tronStats, formattedMaxApr: tronMaxApr } = useTronStakingStats({
        enabled: symbol === 'trx',
    });

    const tronVotes = useSelector((state: StakeRootState & TronStakeRootState) =>
        selectTronVotesByAccountKey(state, accountKey),
    );

    const votedTronApr = getTronVotedApr(
        tronStats.data,
        tronVotes.map(({ address }) => address),
    );

    const tronApr = formatTronApr(votedTronApr ?? tronMaxApr);

    const rewardsBalance = useSelector((state: StakeRootState) =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const apyValue = symbol === 'trx' ? tronApr : apy;

    return (
        <ManualStakedBalancesCard
            accountKey={accountKey}
            symbol={symbol}
            rewardsBalance={rewardsBalance}
            apy={apyValue}
            handleToggleBottomSheet={handleToggleBottomSheet}
        />
    );
};
