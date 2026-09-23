import type { Horizon } from '@stellar/stellar-sdk';

import { BigNumber, scheduleAction } from '@trezor/utils';

import {
    STELLAR_HISTORY_EFFECTS,
    STELLAR_HISTORY_EFFECTS_LIMIT,
    STELLAR_HISTORY_PAGE_TIMEOUT_MS,
    type StellarHistoryEffects,
} from '../../constants';
import type { StellarHorizonServer } from '../../types';
import { isNotFoundError } from '../api';
import { readAccountEffects, toEffectsCursor } from './effects';
import { groupEffectsByOperation } from '../transactions/balances';
import { type OperationGroup, groupOperationsByTransaction } from '../transactions/group';

type EffectRecord = Horizon.ServerApi.EffectRecord;
type OperationRecord = Horizon.ServerApi.OperationRecord;

const HORIZON_MAX_LIMIT = 200;

// One aggregator swap reports eight effects, so a window may not reach its oldest operation.
const MAX_EFFECT_REQUESTS_PER_WINDOW = 2;

export type ReadAccountHistoryParams = {
    horizon: StellarHorizonServer;
    descriptor: string;
    pageSize: number;
    cursor?: string;
};

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

// `join('transactions')` embeds the transaction, saving a request per `operation.transaction()`.
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

/** Reads one page of an account's transaction history from Horizon. */
export const readAccountHistory = async (
    params: ReadAccountHistoryParams,
    effectsSource: StellarHistoryEffects = STELLAR_HISTORY_EFFECTS,
): Promise<OperationGroup[]> => {
    const { pageSize } = params;
    let groups: OperationGroup[] = [];

    try {
        // A page shorter than `pageSize` reads as the end of the history; keep filling the window.
        let { cursor } = params;
        let limit = Math.min(HORIZON_MAX_LIMIT, pageSize * 2);

        const deadline = Date.now() + STELLAR_HISTORY_PAGE_TIMEOUT_MS;

        for (;;) {
            // Returning a short page here would read as the end of the history, so this throws.
            // A single attempt: `scheduleAction` would otherwise retry a 404 until the deadline.
            const window = await scheduleAction(
                () => fetchOperationGroups(params, limit, cursor, effectsSource),
                { attempts: 1, timeout: Math.max(1, deadline - Date.now()) },
            );
            groups = [...groups, ...window.groups];

            if (groups.length >= pageSize || !window.isWindowFull) break;

            // Guards against a response exceeding the protocol's 100-operation cap.
            if (window.groups.length === 0 && limit === HORIZON_MAX_LIMIT) break;

            limit = HORIZON_MAX_LIMIT;
            cursor = window.groups[window.groups.length - 1]?.cursor ?? cursor;
        }
    } catch (error) {
        // Horizon answers 404 for an account with no activity in its retained history.
        if (!isNotFoundError(error)) {
            throw error;
        }
        // Whatever earlier windows returned is still the head of the page.
    }

    return groups.slice(0, pageSize);
};
