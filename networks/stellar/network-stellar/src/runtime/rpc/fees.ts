import type { StellarRpcServer } from '../../types/rpc';

/**
 * Inclusion fee estimate, in stroops. p70 is the percentile Suite has always used, previously
 * read from Horizon's `fee_charged`.
 */
export const readInclusionFee = async (server: StellarRpcServer): Promise<string> => {
    const { inclusionFee } = await server.getFeeStats();

    return inclusionFee.p70;
};
