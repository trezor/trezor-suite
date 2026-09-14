import type { Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import {
    STELLAR_HISTORY_EFFECTS,
    STELLAR_HISTORY_EFFECTS_LIMIT,
    type StellarHistoryEffects,
} from '../../constants';
import type { StellarHorizonServer } from '../../types';
import { isNotFoundError } from '../api';
import { readAccountEffects, toEffectsCursor } from './effects';
import { groupEffectsByOperation } from '../transactions/balances';
import { type OperationGroup, groupOperationsByTransaction } from '../transactions/group';

type EffectRecord = Horizon.ServerApi.EffectRecord;
type OperationRecord = Horizon.ServerApi.OperationRecord;

// https://developers.stellar.org/docs/data/apis/horizon/api-reference/structure/pagination
const HORIZON_MAX_LIMIT = 200;

// Effects per operation are unbounded — one swap through an aggregator reports eight — so a
// window does not always reach the operations it must describe; chasing it is worth one request.
const MAX_EFFECT_REQUESTS_PER_WINDOW = 2;

export interface ReadAccountHistoryParams {
    horizon: StellarHorizonServer;
    descriptor: string;
    pageSize: number;
    cursor?: string;
}

/** Whether the effects window reaches at least as far back as the operation it must describe. */
const reachesOperation = (effects: EffectRecord[], operationId: string) => {
    const oldest = effects[effects.length - 1];
    if (!oldest) return false;

    const [oldestOperationId] = oldest.paging_token.split('-');

    // A TOID runs to nineteen digits, so the comparison cannot be lexical.
    return !!oldestOperationId && new BigNumber(oldestOperationId).lte(operationId);
};

/** Reads effects for one window of operations, continuing until it reaches the oldest one. */
const readWindowEffects = async (
    { horizon, descriptor }: ReadAccountHistoryParams,
    firstWindow: EffectRecord[],
    operations: OperationRecord[],
) => {
    const oldestOperation = operations[operations.length - 1];
    const effects = [...firstWindow];
    let window = firstWindow;

    for (let request = 1; request < MAX_EFFECT_REQUESTS_PER_WINDOW; request++) {
        const isWindowFull = window.length === STELLAR_HISTORY_EFFECTS_LIMIT;
        if (!oldestOperation || !isWindowFull || reachesOperation(effects, oldestOperation.id))
            break;

        const cursor = effects[effects.length - 1]?.paging_token;
        if (!cursor) break;

        const next = await readAccountEffects({ horizon, descriptor, cursor });
        if (!next?.length) break;

        effects.push(...next);
        window = next;
    }

    return effects;
};

// A SAC reports its transfers as `asset_balance_changes` on the host-function operation, which
// only the operations resource exposes. `join('transactions')` embeds the transaction in the same
// response — without it, `operation.transaction()` costs one HTTP request each.
const fetchOperationGroups = async (
    params: ReadAccountHistoryParams,
    limit: number,
    cursor: string | undefined,
    effectsSource: StellarHistoryEffects,
) => {
    const { horizon, descriptor } = params;
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

    // The effects cursor follows from the operations cursor, so both windows are read at once.
    const [{ records }, firstEffectWindow] = await Promise.all([
        requestBuilder.call(),
        effectsSource === 'off'
            ? undefined
            : readAccountEffects({
                  horizon,
                  descriptor,
                  cursor: cursor && toEffectsCursor(cursor),
              }),
    ]);

    const effects = firstEffectWindow
        ? await readWindowEffects(params, firstEffectWindow, records)
        : [];

    return {
        groups: groupOperationsByTransaction(
            records,
            records.length === limit,
            groupEffectsByOperation(effects),
        ),
        isWindowFull: records.length === limit,
    };
};

/**
 * Reads one page of an account's transaction history — the one thing Stellar RPC cannot serve, as
 * a per-account scan costs hundreds of sequential requests.
 */
export const readAccountHistory = async (
    params: ReadAccountHistoryParams,
    effectsSource: StellarHistoryEffects = STELLAR_HISTORY_EFFECTS,
): Promise<OperationGroup[]> => {
    const { pageSize } = params;
    let groups: OperationGroup[] = [];

    try {
        // Consumers read a page shorter than `pageSize` as the end of the history, while an
        // operation window can hold arbitrarily few complete transactions.
        let { cursor } = params;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        for (;;) {
            const window = await fetchOperationGroups(params, limit, cursor, effectsSource);
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
