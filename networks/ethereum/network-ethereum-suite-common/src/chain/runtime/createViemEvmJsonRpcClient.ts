import { type Hex, createPublicClient, fallback, http } from 'viem';

import type { CreateEvmJsonRpcClient, EvmFeesPerGas } from './EvmJsonRpcClient';

export type ViemEvmJsonRpcClientDeps = {
    /** The app's fetch, so requests follow its network settings (proxy, Tor). */
    fetch: typeof fetch;
};

export type ViemEvmJsonRpcClient = CreateEvmJsonRpcClient;

const REQUEST_TIMEOUT_MS = 15_000;

const asHex = (value: string): Hex => (value.startsWith('0x') ? value : `0x${value}`) as Hex;

/** JSON-RPC over HTTP through viem, falling back to the next node when one fails. */
export const createViemEvmJsonRpcClient =
    (deps: ViemEvmJsonRpcClientDeps): ViemEvmJsonRpcClient =>
    rpcUrls => {
        const client = createPublicClient({
            transport: fallback(
                rpcUrls.map(url =>
                    http(url, { fetchFn: deps.fetch, timeout: REQUEST_TIMEOUT_MS, retryCount: 1 }),
                ),
            ),
        });

        return {
            getChainId: () => client.getChainId(),
            getBlockNumber: () => client.getBlockNumber(),
            getBalance: address => client.getBalance({ address: asHex(address) }),
            getTransactionCount: (address, blockTag) =>
                client.getTransactionCount({ address: asHex(address), blockTag }),
            estimateGas: ({ from, to, value, data }) =>
                client.estimateGas({
                    account: asHex(from),
                    to: asHex(to),
                    value,
                    data: data ? asHex(data) : undefined,
                }),
            estimateFeesPerGas: async (): Promise<EvmFeesPerGas> => {
                try {
                    const { maxFeePerGas, maxPriorityFeePerGas } =
                        await client.estimateFeesPerGas();

                    return { maxFeePerGas, maxPriorityFeePerGas };
                } catch {
                    // Chains without EIP-1559 quote a single gas price.
                    return { gasPrice: await client.getGasPrice() };
                }
            },
            sendRawTransaction: serializedTransaction =>
                client.sendRawTransaction({ serializedTransaction: asHex(serializedTransaction) }),
        };
    };
