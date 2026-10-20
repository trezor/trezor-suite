import {
    type Abi,
    type AbiStateMutability,
    type ContractFunctionName,
    type ContractFunctionReturnType,
    decodeFunctionResult,
    encodeFunctionData,
    isHex,
} from 'viem';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { MULTICALL3_ADDRESS, MULTICALL3_AGGREGATE3_ABI } from '@trezor/network-ethereum/constants';
import { type TimerId } from '@trezor/type-utils';

const DEFAULT_TIMEOUT_MS = 15_000;

export type EvmReadCall<
    TAbi extends Abi = Abi,
    TFunctionName extends ContractFunctionName<TAbi> = ContractFunctionName<TAbi>,
> = {
    to: `0x${string}`;
    abi: TAbi;
    functionName: TFunctionName;
    args?: readonly unknown[];
    /** Pre-encoded calldata; when present it is sent as is and `args` are ignored. */
    data?: `0x${string}`;
};

export type EvmReadFailure = { success: false; errorName: string };

export type EvmReadResult<T = unknown> = { success: true; value: T } | EvmReadFailure;

export type EvmReadValue<
    TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi>,
> = ContractFunctionReturnType<TAbi, AbiStateMutability, TFunctionName>;

export type EvmRead = {
    one: <const TAbi extends Abi, TFunctionName extends ContractFunctionName<TAbi>>(
        call: EvmReadCall<TAbi, TFunctionName>,
    ) => Promise<EvmReadResult<EvmReadValue<TAbi, TFunctionName>>>;
    many: (calls: readonly EvmReadCall[]) => Promise<EvmReadResult[]>;
};

export type CreateEvmReadParams = {
    symbol: NetworkSymbol;
    from: string;
    identity?: string;
    timeoutMs?: number;
};

class EvmReadTimeoutError extends Error {
    override name = 'EvmReadTimeoutError';
}

// Only the error name ever leaves this module: messages may embed the descriptor or the RPC URL.
const getErrorName = (error: unknown) =>
    error instanceof Error && error.name ? error.name : 'UnknownError';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timer: TimerId | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new EvmReadTimeoutError()), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const encodeCall = ({ abi, functionName, args, data }: EvmReadCall) =>
    data ?? encodeFunctionData({ abi, functionName, args });

const decodeCall = ({ abi, functionName }: EvmReadCall, data: `0x${string}`): EvmReadResult => {
    try {
        return { success: true, value: decodeFunctionResult({ abi, functionName, data }) };
    } catch (error) {
        return { success: false, errorName: getErrorName(error) };
    }
};

type RpcCallResult = { success: true; data: `0x${string}` } | EvmReadFailure;

export const createEvmRead = ({
    symbol,
    from,
    identity,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}: CreateEvmReadParams): EvmRead => {
    const rpcCall = async (to: string, data: `0x${string}`): Promise<RpcCallResult> => {
        try {
            const response = await withTimeout(
                TrezorConnect.blockchainEvmRpcCall({
                    coin: asCoinSymbol(symbol),
                    identity,
                    from,
                    to,
                    data,
                }),
                timeoutMs,
            );

            if (!response.success) {
                return { success: false, errorName: response.error.code };
            }

            const result = response.payload.data;
            if (!isHex(result) || result === '0x') {
                return { success: false, errorName: 'EmptyResult' };
            }

            return { success: true, data: result };
        } catch (error) {
            return { success: false, errorName: getErrorName(error) };
        }
    };

    const readOne = async (call: EvmReadCall): Promise<EvmReadResult> => {
        const result = await rpcCall(call.to, encodeCall(call));

        return result.success ? decodeCall(call, result.data) : result;
    };

    const readIndividually = (calls: readonly EvmReadCall[]) => Promise.all(calls.map(readOne));

    // One aggregate3 request for the whole batch; every call that reverts fails on its own. When
    // the aggregate call itself fails (no Multicall3 on a custom RPC, or an unexpected answer) the
    // batch is read call by call instead.
    const readAggregated = async (calls: readonly EvmReadCall[]): Promise<EvmReadResult[]> => {
        const aggregate = await rpcCall(
            MULTICALL3_ADDRESS,
            encodeFunctionData({
                abi: MULTICALL3_AGGREGATE3_ABI,
                functionName: 'aggregate3',
                args: [
                    calls.map(call => ({
                        target: call.to,
                        allowFailure: true,
                        callData: encodeCall(call),
                    })),
                ],
            }),
        );

        if (!aggregate.success) {
            return readIndividually(calls);
        }

        let entries;
        try {
            entries = decodeFunctionResult({
                abi: MULTICALL3_AGGREGATE3_ABI,
                functionName: 'aggregate3',
                data: aggregate.data,
            });
        } catch {
            return readIndividually(calls);
        }

        return calls.map((call, index) => {
            const entry = entries[index];

            return entry?.success
                ? decodeCall(call, entry.returnData)
                : { success: false, errorName: 'CallReverted' };
        });
    };

    const many: EvmRead['many'] = calls => {
        if (calls.length === 0) return Promise.resolve([]);
        if (calls.length === 1) return readIndividually(calls);

        return readAggregated(calls);
    };

    // The decoded value is typed by the call's ABI and function name; viem decodes it as unknown.
    const one = async <const TAbi extends Abi, TFunctionName extends ContractFunctionName<TAbi>>(
        call: EvmReadCall<TAbi, TFunctionName>,
    ): Promise<EvmReadResult<EvmReadValue<TAbi, TFunctionName>>> => {
        const result = await readOne(call);

        return result as EvmReadResult<EvmReadValue<TAbi, TFunctionName>>;
    };

    return { one, many };
};
