import type { RpcProvider } from '@anon-rpc/browser-harness';
import { createPublicClient, http } from 'viem';

import { CustomError } from '@trezor/blockchain-link-types';
import type { AnonRpcSettings } from '@trezor/blockchain-link-types';

export type AnonRpcClient = {
    fetch: typeof fetch;
    close: () => void;
};

type EthCallParams = [transaction: { to: `0x${string}`; data: `0x${string}` }, block: 'latest'];

const createBootstrapProvider = (bootstrapRpcUrl: string): RpcProvider => {
    const bootstrapClient = createPublicClient({ transport: http(bootstrapRpcUrl) });

    return {
        request: ({ method, params }) => {
            // The harness only needs this channel to read the specifier. Refusing anything else
            // keeps the one unanonymized channel from quietly carrying other traffic.
            if (method !== 'eth_call') {
                return Promise.reject(new CustomError('anon_rpc_bootstrap', `+${method}`));
            }

            return bootstrapClient.request({ method, params: params as EthCallParams });
        },
    };
};

export const createAnonRpcClient = async ({
    specifier,
    bootstrapRpcUrl,
    config,
}: AnonRpcSettings): Promise<AnonRpcClient> => {
    // The harness sandboxes the client in an iframe, so it needs a DOM, which Web Workers and Node
    // lack. Checking first also keeps the harness from being loaded where it cannot run.
    if (typeof document === 'undefined') {
        throw new CustomError('anon_rpc_unsupported');
    }

    const { AnonRpcWorker } = await import('@anon-rpc/browser-harness');

    // Calls made before the client is ready are buffered rather than dropped, so `ready` is not
    // awaited here. The connection probe's timeout bounds a client that never becomes ready.
    return new AnonRpcWorker({
        address: specifier,
        config,
        preExisting: { rpcProvider: createBootstrapProvider(bootstrapRpcUrl) },
    });
};
