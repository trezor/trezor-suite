import { BigNumber } from '@trezor/utils';

import { type TrxStats } from '../../api/types';

export const formatTronApr = (apr: number | null | undefined): number | null =>
    apr != null ? new BigNumber(apr).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber() : null;

type TronVotedRepresentative = { address: string; voteCount: string };

export const getTronVotedApr = (
    stats: TrxStats | undefined,
    votes: TronVotedRepresentative[],
): number | null => {
    const ratedVotes = votes.flatMap(({ address, voteCount }) => {
        const representative = stats?.find(stat => stat.address === address);
        const count = new BigNumber(voteCount);

        return representative && count.gt(0) ? [{ apr: representative.apr, count }] : [];
    });

    if (ratedVotes.length === 0) {
        return null;
    }

    const totalVotes = BigNumber.sum(...ratedVotes.map(({ count }) => count));
    const weightedApr = BigNumber.sum(...ratedVotes.map(({ apr, count }) => count.times(apr)));

    return weightedApr.div(totalVotes).toNumber();
};
