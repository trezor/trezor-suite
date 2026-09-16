import { Horizon } from '@stellar/stellar-sdk';

import { STELLAR_RPC_READ_FALLBACK } from '../constants';
import type { StellarConnection } from '../types';
import { readNetworkFromHorizon } from './horizon/network';
import { readNetwork } from './rpc/network';
import { getStellarRpcServer } from './rpc/server';

/** One origin serves both: JSON-RPC on `POST /` and the Horizon REST paths. */
export const createStellarConnection = async (
    url: string,
    userAgent?: string,
): Promise<StellarConnection> => {
    const horizon = new Horizon.Server(url, {
        headers: userAgent ? { 'User-Agent': userAgent } : {},
        allowHttp: url.startsWith('http://'),
    });
    const rpc = getStellarRpcServer(url, userAgent);

    // Every other request waits on this handshake, so it must survive an RPC outage.
    const { isTestnet, passphrase } = await readNetwork(rpc).catch(async error => {
        if (STELLAR_RPC_READ_FALLBACK !== 'horizon') {
            throw error;
        }

        try {
            return await readNetworkFromHorizon(horizon);
        } catch {
            throw error;
        }
    });

    return { rpc, horizon, isTestnet, passphrase, url };
};
