import { BigNumber } from '@trezor/utils';

import { type TrxStats } from '../../api/types';

export const formatTronApr = (apr: number | null | undefined): number | null =>
    apr != null ? new BigNumber(apr).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber() : null;

export const getTronVotedApr = (
    stats: TrxStats | undefined,
    votedAddresses: string[],
): number | null => {
    if (!stats?.length || votedAddresses.length === 0) {
        return null;
    }

    const votedAprs = stats
        .filter(({ address }) => votedAddresses.includes(address))
        .map(({ apr }) => apr);

    return votedAprs.length ? Math.max(...votedAprs) : null;
};
