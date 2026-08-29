import { CustomError } from '@trezor/blockchain-link-types';
import type { StellarAPI, StellarLedgerRecord } from '@trezor/network-stellar/types';

export const fetchLatestLedger = async (api: StellarAPI): Promise<StellarLedgerRecord> => {
    const latestLedgerInfo = await api.ledgers().order('desc').limit(1).call();

    if (latestLedgerInfo.records.length === 0) {
        throw new CustomError('worker_invalid_horizon_response');
    }

    const { records } = latestLedgerInfo;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const record: (typeof records)[number] = records[0];

    return record;
};
