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

// Effects per operation are unbounded — a single swap through an aggregator reports eight — so one
// window does not always reach back as far as the operations it has to describe. Chasing it is
// worth one more request; past that the remaining operations are described from themselves.
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

/**
 * Reads the account's effects for one window of operations, continuing while the window has not
 * reached the oldest operation it needs to cover.
 */
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

// A Stellar Asset Contract reports its transfers as `asset_balance_changes` on the host-function
// operation, which only the operations resource exposes. `join('transactions')` embeds the
// transaction in the same response — without it, reading `operation.transaction()` would fire one
// HTTP request per operation.
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

    // The effects cursor follows from the operations cursor, so both windows are read at once
    // rather than one after the other.
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
 * Reads one page of an account's transaction history. History is the one thing Stellar RPC
 * cannot serve — a per-account scan costs hundreds of sequential requests — so it stays on
 * Horizon.
 */
export const readAccountHistory = async (
    params: ReadAccountHistoryParams,
    effectsSource: StellarHistoryEffects = STELLAR_HISTORY_EFFECTS,
): Promise<OperationGroup[]> => {
    const { pageSize } = params;
    let groups: OperationGroup[] = [];

    try {
        // The page consumers assume exactly `pageSize` transactions per page — a shorter page
        // reads as the end of the history — while an operation window can hold arbitrarily few
        // complete transactions, so windows are accumulated until the page fills up or the
        // history ends.
        let { cursor } = params;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        for (;;) {
            const window = await fetchOperationGroups(params, limit, cursor, effectsSource);
            groups = [...groups, ...window.groups];

            if (groups.length >= pageSize || !window.isWindowFull) break;

            // A single transaction can fill a whole window, dropping its trailing group with
            // nothing complete before it. The protocol caps operations per transaction at 100,
            // so the largest window Horizon allows always completes at least one group — the
            // guard only protects against a Horizon response violating that cap.
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
