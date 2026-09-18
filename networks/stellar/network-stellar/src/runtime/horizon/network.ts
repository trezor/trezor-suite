import { Networks } from '@stellar/stellar-sdk';

import type { StellarHorizonServer } from '../../types';
import type { StellarNetworkInfo } from '../rpc/network';

/** The Horizon stand-in for `readVersion`; it reports the Core version, not the RPC node's. */
export const readVersionFromHorizon = async (horizon: StellarHorizonServer): Promise<string> => {
    const { core_version: coreVersion } = await horizon.root();

    return coreVersion;
};

/** The Horizon stand-in for `readNetwork`; both protocols report the same passphrase. */
export const readNetworkFromHorizon = async (
    horizon: StellarHorizonServer,
): Promise<StellarNetworkInfo> => {
    const { network_passphrase: passphrase } = await horizon.root();

    return { passphrase, isTestnet: passphrase === Networks.TESTNET };
};
