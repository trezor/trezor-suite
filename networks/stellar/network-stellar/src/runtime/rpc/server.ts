import { rpc } from '@stellar/stellar-sdk';

import type { StellarRpcServer } from '../../types/rpc';

export const getStellarRpcServer = (url: string, userAgent?: string): StellarRpcServer =>
    new rpc.Server(url, {
        allowHttp: url.startsWith('http://'),
        headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    });
