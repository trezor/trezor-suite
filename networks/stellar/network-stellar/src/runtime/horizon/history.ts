import type { StellarHorizonServer } from '../../types';
import { isNotFoundError } from '../api';
import { type OperationGroup, groupOperationsByTransaction } from '../transactions/group';

// https://developers.stellar.org/docs/data/apis/horizon/api-reference/structure/pagination
const HORIZON_MAX_LIMIT = 200;

export interface ReadAccountHistoryParams {
    horizon: StellarHorizonServer;
    descriptor: string;
    pageSize: number;
    cursor?: string;
}

// A SAC reports its transfers as `asset_balance_changes` on the host-function operation, which
// only the operations resource exposes. `join('transactions')` embeds the transaction in the same
// response — without it, `operation.transaction()` costs one HTTP request each.
const fetchOperationGroups = async (
    { horizon, descriptor }: ReadAccountHistoryParams,
    limit: number,
    cursor: string | undefined,
) => {
    const requestBuilder = horizon
        .operations()
        .forAccount(descriptor)
        .includeFailed(true)
        .join('transactions')
        .limit(limit)
        .order('desc');
    if (cursor) {
        requestBuilder.cursor(cursor);
    }

    const { records } = await requestBuilder.call();

    return {
        groups: groupOperationsByTransaction(records, records.length === limit),
        isWindowFull: records.length === limit,
    };
};

/**
 * Reads one page of an account's transaction history — the one thing Stellar RPC cannot serve, as
 * a per-account scan costs hundreds of sequential requests.
 */
export const readAccountHistory = async (
    params: ReadAccountHistoryParams,
): Promise<OperationGroup[]> => {
    const { pageSize } = params;
    let groups: OperationGroup[] = [];

    try {
        // Consumers read a page shorter than `pageSize` as the end of the history, while an
        // operation window can hold arbitrarily few complete transactions.
        let { cursor } = params;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        for (;;) {
            const window = await fetchOperationGroups(params, limit, cursor);
            groups = [...groups, ...window.groups];

            if (groups.length >= pageSize || !window.isWindowFull) break;

            // The protocol caps operations per transaction at 100, so the largest window always
            // completes a group; this only guards a Horizon response violating that cap.
            if (window.groups.length === 0 && limit === HORIZON_MAX_LIMIT) break;

            limit = HORIZON_MAX_LIMIT;
            cursor = window.groups[window.groups.length - 1]?.cursor ?? cursor;
        }
    } catch (error) {
        // Horizon retains limited history; accounts without activity in the retained window
        // return 404 on the operations endpoint even though they exist.
        if (!isNotFoundError(error)) {
            throw error;
        }

        return [];
    }

    return groups.slice(0, pageSize);
};
