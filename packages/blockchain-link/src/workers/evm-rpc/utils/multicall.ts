import { type Abi, type PublicClient, decodeFunctionResult, encodeFunctionData } from 'viem';

import { cachePerClient } from './client';
import { getErrorName } from './errors';

// Canonical CREATE2 deployment, identical on every chain Multicall3 is deployed to.
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

const AGGREGATE3_ABI = [
    {
        name: 'aggregate3',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            {
                name: 'calls',
                type: 'tuple[]',
                components: [
                    { name: 'target', type: 'address' },
                    { name: 'allowFailure', type: 'bool' },
                    { name: 'callData', type: 'bytes' },
                ],
            },
        ],
        outputs: [
            {
                name: 'returnData',
                type: 'tuple[]',
                components: [
                    { name: 'success', type: 'bool' },
                    { name: 'returnData', type: 'bytes' },
                ],
            },
        ],
    },
] as const;

export type BatchCall = {
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
};

const encodeCall = ({ abi, functionName, args }: BatchCall) =>
    encodeFunctionData({ abi, functionName, args });

const decodeCall = ({ abi, functionName }: BatchCall, data: `0x${string}`) => {
    try {
        return decodeFunctionResult({ abi, functionName, data });
    } catch {
        return undefined;
    }
};

// Multicall3 cannot appear on a chain under a running connection.
const multicall3Support = new WeakMap<PublicClient, Promise<boolean>>();

// Custom RPCs may point at a chain without Multicall3, so probe before relying on it.
export const hasMulticall3 = (client: PublicClient) =>
    cachePerClient(multicall3Support, client, async () => {
        const code = await client.getCode({ address: MULTICALL3_ADDRESS });

        return !!code && code !== '0x';
    }).catch(() => false);

// Raised when the address answers with something that is not an aggregate3 result. Unlike a
// network error this will not fix itself, so the connection stops attempting to batch.
class NotMulticall3Error extends Error {
    override name = 'NotMulticall3Error';
}

const readAggregated = async (client: PublicClient, calls: readonly BatchCall[]) => {
    const data = encodeFunctionData({
        abi: AGGREGATE3_ABI,
        functionName: 'aggregate3',
        args: [
            calls.map(call => ({
                target: call.address,
                allowFailure: true,
                callData: encodeCall(call),
            })),
        ],
    });

    const result = await client.call({ to: MULTICALL3_ADDRESS, data });

    if (!result.data) {
        throw new NotMulticall3Error('aggregate3 returned no data');
    }

    let entries;
    try {
        entries = decodeFunctionResult({
            abi: AGGREGATE3_ABI,
            functionName: 'aggregate3',
            data: result.data,
        });
    } catch {
        throw new NotMulticall3Error('aggregate3 returned an unexpected result');
    }

    // Map over the calls, not the response, so there is one slot per requested call even if a
    // non-conforming Multicall3 returns a different number of entries.
    return calls.map((call, index) => {
        const entry = entries[index];

        return entry?.success ? decodeCall(call, entry.returnData) : undefined;
    });
};

const readIndividually = (client: PublicClient, calls: readonly BatchCall[]) =>
    Promise.all(
        calls.map(async call => {
            try {
                const result = await client.call({ to: call.address, data: encodeCall(call) });

                return result.data ? decodeCall(call, result.data) : undefined;
            } catch {
                return undefined;
            }
        }),
    );

/**
 * Reads several contract functions in one Multicall3 `aggregate3` request, falling back to one
 * request per call when Multicall3 is not deployed or the batch fails. Never rejects: a call that
 * reverts or cannot be read yields `undefined` in its slot, and callers decide whether that is
 * fatal or a default.
 */
export const batchRead = async (
    client: PublicClient,
    calls: readonly BatchCall[],
): Promise<unknown[]> => {
    if (calls.length === 0) {
        return [];
    }

    if (await hasMulticall3(client)) {
        try {
            return await readAggregated(client, calls);
        } catch (error) {
            // Retrying unbatched keeps one bad batch from failing the whole read. When the address
            // is not a real Multicall3 that retry would repeat on every poll, costing more requests
            // than never batching, so stop trusting it for the rest of the connection.
            if (error instanceof NotMulticall3Error) {
                multicall3Support.set(client, Promise.resolve(false));
            }

            console.warn(
                '[evm-rpc] Multicall3 batch failed, reading calls individually:',
                getErrorName(error),
            );
        }
    }

    return readIndividually(client, calls);
};
