import type { StellarHorizonServer } from '../../types';
import type { StellarLedgerHead } from '../rpc/ledger';

/** The Horizon stand-in for `readLatestLedger`; it serves the same four fields. */
export const readLatestLedgerFromHorizon = async (
    horizon: StellarHorizonServer,
): Promise<StellarLedgerHead> => {
    const { records } = await horizon.ledgers().order('desc').limit(1).call();
    const [ledger] = records;

    if (!ledger) {
        throw new Error('Horizon returned no ledgers');
    }

    return {
        sequence: ledger.sequence,
        hash: ledger.hash,
        baseReserve: ledger.base_reserve_in_stroops.toString(),
        protocolVersion: ledger.protocol_version,
    };
};
