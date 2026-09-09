import type { Horizon } from '@stellar/stellar-sdk';

import { STELLAR_HISTORY_EFFECTS_LIMIT } from '../../constants';
import type { StellarHorizonServer } from '../../types';

type EffectRecord = Horizon.ServerApi.EffectRecord;

export interface ReadAccountEffectsParams {
    horizon: StellarHorizonServer;
    descriptor: string;
    /** an effects cursor — see `toEffectsCursor` */
    cursor?: string;
}

/**
 * Turns the operation cursor a history page carries into the effects cursor that starts just below
 * it.
 *
 * An effects cursor is the pair `<operation id>-<effect index>` and effect indexes start at one,
 * so `<operation id>-0` is a well-formed pair sitting below every effect of that operation.
 * Descending from there returns the effects of the operations that follow it — the window the next
 * page describes — while the cursor operation's own effects were reported with the previous page.
 */
export const toEffectsCursor = (operationCursor: string) => `${operationCursor}-0`;

/**
 * Reads one window of the account's effects, newest first.
 *
 * Never throws. Effects only enrich a record that the operations resource can already describe on
 * its own, so an effects outage degrades the history rather than failing it — including the 5xx
 * that the history read would otherwise rethrow.
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
