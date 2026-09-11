import { Networks } from '@stellar/stellar-sdk';

import type { StellarRpcServer } from '../../types/rpc';

export interface StellarNetworkInfo {
    passphrase: string;
    isTestnet: boolean;
}

export const readNetwork = async (server: StellarRpcServer): Promise<StellarNetworkInfo> => {
    const { passphrase } = await server.getNetwork();

    return { passphrase, isTestnet: passphrase === Networks.TESTNET };
};

export const readVersion = async (server: StellarRpcServer): Promise<string> => {
    const { version } = await server.getVersionInfo();

    return version;
};
