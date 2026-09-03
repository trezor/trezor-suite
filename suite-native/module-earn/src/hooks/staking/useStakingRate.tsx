import { useSelector } from 'react-redux';

import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { getTronVotes } from '@suite-common/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { selectApy, useSelector as useStakingSelector } from '@suite-native/staking';

interface UseStakingRateProps {
    symbol?: NetworkSymbol;
    accountKey?: AccountKey;
}

export const useStakingRate = ({ symbol, accountKey }: UseStakingRateProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const apy = useStakingSelector(state =>
        selectApy(state, { networkSymbol: symbol, accountKey }),
    );

    const { stats, maxApr } = useTronStakingStats({
        enabled: symbol === 'trx',
    });

    if (symbol !== 'trx') {
        return { rate: apy };
    }

    if (!accountKey || !account) {
        return { rate: formatTronApr(maxApr) };
    }

    const votes = getTronVotes(account);

    const votedApr = getTronVotedApr(
        stats.data,
        votes.map(({ address }) => address),
    );

    const apr = votedApr ?? maxApr;

    return { rate: formatTronApr(apr) };
};
