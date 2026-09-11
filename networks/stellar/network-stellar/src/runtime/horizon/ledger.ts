import type { StellarHorizonServer } from '../../types';
import type { StellarLedgerHead } from '../rpc/ledger';

/**
 * Reads the ledger head from Horizon, for use when Stellar RPC is unreachable.
 *
 * Horizon serves the same four fields the RPC path decodes out of the ledger header, so a degraded
 * read loses nothing here — unlike account state, where contract-token balances are RPC-only.
 */
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
