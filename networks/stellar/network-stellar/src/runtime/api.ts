import { Horizon, NotFoundError } from '@stellar/stellar-sdk';

import { STELLAR_RPC_READ_FALLBACK } from '../constants';
import type { StellarAPI } from '../types';
import { readNetworkFromHorizon } from './horizon/network';
import { readNetwork } from './rpc/network';
import { getStellarRpcServer } from './rpc/server';

export { NotFoundError };

export const isNotFoundError = (error: unknown) => error instanceof NotFoundError;

/**
 * Both clients point at the same origin: it proxies JSON-RPC on `POST /` and the Horizon REST
 * endpoints on `GET /accounts/…`, so there is a single URL to configure.
 */
export const getStellarConnection = async (
    url: string,
    userAgent?: string,
): Promise<StellarAPI> => {
    const horizon = new Horizon.Server(url, {
        headers: userAgent ? { 'User-Agent': userAgent } : {},
        allowHttp: url.startsWith('http://'),
    });
    const rpc = getStellarRpcServer(url, userAgent);

    // This is the handshake every other request waits on, so an RPC outage here would fail the
    // whole backend before any read could degrade to Horizon — which is what
    // `STELLAR_RPC_READ_FALLBACK` exists to prevent. Both protocols report the same passphrase
    // for the same network, so either can answer it.
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
