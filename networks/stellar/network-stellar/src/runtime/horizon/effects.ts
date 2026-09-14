import type { Horizon } from '@stellar/stellar-sdk';

import { STELLAR_HISTORY_EFFECTS_LIMIT } from '../../constants';
import type { StellarHorizonServer } from '../../types';

type EffectRecord = Horizon.ServerApi.EffectRecord;

export interface ReadAccountEffectsParams {
    horizon: StellarHorizonServer;
    descriptor: string;
    /** An effects cursor — see `toEffectsCursor`. */
    cursor?: string;
}

/**
 * Turns a history page's operation cursor into the effects cursor just below it. An effects cursor
 * is the pair `<operation id>-<effect index>` and indexes start at one, so `<operation id>-0` sits
 * below every effect of that operation; descending from there returns the next page's window, the
 * cursor operation's own effects having been reported with the previous page.
 */
export const toEffectsCursor = (operationCursor: string) => `${operationCursor}-0`;

/**
 * Reads one window of the account's effects, newest first. Never throws: effects only enrich a
 * record the operations resource can already describe, so an outage degrades the history rather
 * than failing it — including the 5xx the history read would otherwise rethrow.
 */
export const readAccountEffects = async ({
    horizon,
    descriptor,
    cursor,
}: ReadAccountEffectsParams): Promise<EffectRecord[] | undefined> => {
    try {
        const request = horizon
            .effects()
            .forAccount(descriptor)
            .limit(STELLAR_HISTORY_EFFECTS_LIMIT)
            .order('desc');

        if (cursor) {
            request.cursor(cursor);
        }

        const { records } = await request.call();

        return records;
    } catch (error) {
        console.warn('Stellar: failed to read the account effects', error);

        return undefined;
    }
};
