import type { Horizon } from '@stellar/stellar-sdk';

import { STELLAR_HISTORY_EFFECTS_LIMIT } from '../../constants';
import type { StellarHorizonServer } from '../../types';

type EffectRecord = Horizon.ServerApi.EffectRecord;

export interface ReadAccountEffectsParams {
    horizon: StellarHorizonServer;
    descriptor: string;
    cursor?: string;
}

/** Effect cursors are `<operation id>-<index>` from 1, so `-0` sits below the operation. */
export const toEffectsCursor = (operationCursor: string) => `${operationCursor}-0`;

/** Never throws: effects only enrich records, so an outage degrades the history, not fails it. */
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
