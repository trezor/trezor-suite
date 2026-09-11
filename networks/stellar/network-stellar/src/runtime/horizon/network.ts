import type { StellarHorizonServer } from '../../types';

/**
 * Reads a version string from Horizon, for use when Stellar RPC is unreachable. The RPC path
 * reports the RPC node's own version, so the two are not interchangeable — the Core version is
 * the closest equivalent, and it is what identifies the network the data came from.
 */
export const readVersionFromHorizon = async (horizon: StellarHorizonServer): Promise<string> => {
    const { core_version: coreVersion } = await horizon.root();

    return coreVersion;
};
