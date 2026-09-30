import type { StellarRpcServer } from '../../types/rpc';

/** Inclusion fee in stroops; p70 is the percentile Suite has always used. */
export const readInclusionFee = async (server: StellarRpcServer): Promise<string> => {
    const { inclusionFee } = await server.getFeeStats();

    return inclusionFee.p70;
};

/**
 * Soroban transactions surge-price in a lane of their own, so a contract transfer bid at the
 * classic percentile sits below the whole observed Soroban market and is the first dropped once
 * that lane fills.
 */
export const readSorobanInclusionFee = async (server: StellarRpcServer): Promise<string> => {
    const { sorobanInclusionFee } = await server.getFeeStats();

    return sorobanInclusionFee.p70;
};
