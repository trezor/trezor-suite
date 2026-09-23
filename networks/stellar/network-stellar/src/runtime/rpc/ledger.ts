import { decodeLedgerHeader } from './decode';
import { STELLAR_BASE_RESERVE } from '../../constants';
import type { StellarRpcServer } from '../../types/rpc';

export type StellarLedgerHead = {
    sequence: number;
    hash: string;
    /** Base reserve in stroops, taken from the ledger header. */
    baseReserve: string;
    protocolVersion: number;
};

// The protocol constant is a safe answer when a node omits the header.
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

export const readLatestLedger = async (server: StellarRpcServer): Promise<StellarLedgerHead> => {
    // The SDK's `getLatestLedger` throws outright when a node omits `headerXdr`.
    const { sequence, id, protocolVersion, headerXdr } = await server._getLatestLedger();

    return {
        sequence,
        hash: id,
        baseReserve: readBaseReserve(headerXdr),
        protocolVersion: Number(protocolVersion),
    };
};
