import { Horizon, NotFoundError } from '@stellar/stellar-sdk';

import type { StellarAPI } from '../types';
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

    const { isTestnet, passphrase } = await readNetwork(rpc);

    return { rpc, horizon, isTestnet, passphrase, url };
};
