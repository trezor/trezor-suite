import type { StellarRpcServer } from '../../types/rpc';

/** Inclusion fee in stroops; p70 is the percentile Suite has always used. */
export const readInclusionFee = async (server: StellarRpcServer): Promise<string> => {
    const { inclusionFee } = await server.getFeeStats();

    return inclusionFee.p70;
};
