import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccountByKey, selectPoolStatsApy } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTronVotes } from '@suite-common/wallet-utils';

import { useSelector } from '../suite';

interface UseStakingYieldProps {
    symbol: NetworkSymbol;
    accountKey?: AccountKey;
}

interface StakingYield {
    apy: number | null;
}

export const useStakingYield = ({ symbol, accountKey }: UseStakingYieldProps): StakingYield => {
    const account = useSelector(state => selectAccountByKey(state, accountKey));

    const apy = useSelector(state =>
        selectPoolStatsApy(state, { networkSymbol: symbol, account: account ?? undefined }),
    );

    const { stats, maxApr } = useTronStakingStats({
        enabled: symbol === 'trx',
    });

    if (symbol !== 'trx') {
        return { apy };
    }

    if (!accountKey || !account) {
        return { apy: formatTronApr(maxApr) };
    }

    const votes = getTronVotes(account);

    const votedApr = getTronVotedApr(
        stats.data,
        votes.map(({ address }) => address),
    );

    const apr = votedApr ?? maxApr;

    return { apy: formatTronApr(apr) };
};
