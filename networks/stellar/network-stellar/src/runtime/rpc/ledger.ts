import { decodeLedgerHeader } from './decode';
import { STELLAR_BASE_RESERVE } from '../../constants';
import type { StellarRpcServer } from '../../types/rpc';

export interface StellarLedgerHead {
    sequence: number;
    hash: string;
    /** Base reserve in stroops, taken from the ledger header. */
    baseReserve: string;
    protocolVersion: number;
}

// The base reserve has changed once in the network's history, so the protocol constant is a
// safe answer when a node omits the header or returns one we cannot parse. Losing the ledger
// head over a cosmetic field would not be.
const readBaseReserve = (headerXdr: string | undefined) => {
    if (!headerXdr) {
        return STELLAR_BASE_RESERVE;
    }

    try {
        return decodeLedgerHeader(headerXdr).baseReserve;
    } catch {
        return STELLAR_BASE_RESERVE;
    }
};

/**
 * Reads the ledger head. One RPC call replaces Horizon's separate ledger and base-reserve reads.
 */
export const readLatestLedger = async (server: StellarRpcServer): Promise<StellarLedgerHead> => {
    // The raw variant is deliberate: the SDK's `getLatestLedger` throws outright when a node
    // omits `headerXdr`, which would cost us the sequence and hash too.
    const { sequence, id, protocolVersion, headerXdr } = await server._getLatestLedger();

    return {
        sequence,
        hash: id,
        baseReserve: readBaseReserve(headerXdr),
        protocolVersion: Number(protocolVersion),
    };
};
