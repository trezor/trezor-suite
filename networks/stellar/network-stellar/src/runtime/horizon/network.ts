import { Networks } from '@stellar/stellar-sdk';

import type { StellarHorizonServer } from '../../types';
import type { StellarNetworkInfo } from '../rpc/network';

/**
 * Reads a version string from Horizon, for use when Stellar RPC is unreachable. The RPC path
 * reports the RPC node's own version, so the two are not interchangeable — the Core version is
 * the closest equivalent, and it is what identifies the network the data came from.
 */
export const readVersionFromHorizon = async (horizon: StellarHorizonServer): Promise<string> => {
    const { core_version: coreVersion } = await horizon.root();

    return coreVersion;
};

/**
 * Reads which network Horizon serves, for use when Stellar RPC is unreachable. Both protocols
 * report the same passphrase for the same network, so this is interchangeable with the RPC read —
 * unlike the version above.
 */
export const readNetworkFromHorizon = async (
    horizon: StellarHorizonServer,
): Promise<StellarNetworkInfo> => {
    const { network_passphrase: passphrase } = await horizon.root();

    return { passphrase, isTestnet: passphrase === Networks.TESTNET };
};
