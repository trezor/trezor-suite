import type { FeeLevel, GetTrezorConnectDep } from '@trezor/connect-common';
import {
    type ChainAccountRef,
    type ChainNetwork,
    ChainNetworkError,
    ChainSendError,
    type ChainSendErrorCode,
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type FeeInfo,
    buildPendingTransaction,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
    subunitsToUnits,
} from '@trezor/network-module-suite-common-types';

import type { CreateEvmJsonRpcClient, EvmFeesPerGas } from './EvmJsonRpcClient';
import type { RuntimeEvmNetworkDefinition } from './RuntimeEvmNetworkDefinition';
import { createEvmChainSend } from '../send/createEvmChainSend';
import { fromWei } from '../send/evm/ethConverter';
import type {
    EstimateEvmGasLimit,
    EvmSendAppDeps,
    ResolveEvmNonceParams,
    ResolvedEvmNonce,
} from '../send/types';

export type EvmJsonRpcChainNetworkDeps = GetTrezorConnectDep<'ethereumSignTransaction'> &
    Pick<EvmSendAppDeps, 'onEvmFeeEstimationFailed'> & {
        createRpcClient: CreateEvmJsonRpcClient;
    };

/** A chain network for a runtime EVM network definition. */
export type EvmJsonRpcChainNetwork = (definition: RuntimeEvmNetworkDefinition) => ChainNetwork;

// Roughly a block on most EVM chains; only used to describe the fee levels.
const ASSUMED_BLOCK_TIME_SECONDS = 12;

const toGwei = (wei: bigint) => fromWei(wei.toString()).toGwei();

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

/** Normal and high fee levels from what the node quotes now; high pays more to be mined sooner. */
const toFeeLevels = (fees: EvmFeesPerGas): FeeLevel[] => {
    if ('gasPrice' in fees) {
        return [
            { label: 'high', feePerUnit: toGwei((fees.gasPrice * 5n) / 4n), blocks: 1 },
            { label: 'normal', feePerUnit: toGwei(fees.gasPrice), blocks: 2 },
        ];
    }

    const highPriorityFee = fees.maxPriorityFeePerGas * 2n;
    const highMaxFee = (fees.maxFeePerGas * 3n) / 2n;
    const highMaxFeePerGas = highMaxFee > highPriorityFee ? highMaxFee : highPriorityFee;

    return [
        {
            label: 'high',
            feePerUnit: toGwei(highMaxFeePerGas),
            maxFeePerGas: toGwei(highMaxFeePerGas),
            maxPriorityFeePerGas: toGwei(highPriorityFee),
            blocks: 1,
        },
        {
            label: 'normal',
            feePerUnit: toGwei(fees.maxFeePerGas),
            maxFeePerGas: toGwei(fees.maxFeePerGas),
            maxPriorityFeePerGas: toGwei(fees.maxPriorityFeePerGas),
            blocks: 2,
        },
    ];
};

/**
 * An EVM network defined at runtime, read and broadcast over its own JSON-RPC nodes. Connect only
 * signs: the device signs for any chain ID. Every compose and broadcast first checks that the
 * nodes serve the chain the definition names, so a misconfigured node cannot redirect a send.
 */
export const createEvmJsonRpcChainNetwork =
    (deps: EvmJsonRpcChainNetworkDeps): EvmJsonRpcChainNetwork =>
    definition => {
        const { symbol, chainId, decimals } = definition;
        const client = deps.createRpcClient(definition.rpcUrls);

        const assertOwnAccount = (ref: Pick<ChainAccountRef, 'symbol'>) => {
            if (ref.symbol !== symbol) throw new ChainNetworkError('symbol-mismatch', symbol);
        };

        const assertServedChain = async (code: ChainSendErrorCode) => {
            const servedChainId = await client.getChainId();
            if (servedChainId !== chainId) {
                throw new ChainSendError(
                    code,
                    symbol,
                    `The network's node serves chain ${servedChainId}, not chain ${chainId}.`,
                    undefined,
                    'message',
                );
            }
        };

        const estimateEvmGasLimit: EstimateEvmGasLimit = async ({ from, to, value, data }) => {
            try {
                const gas = await client.estimateGas({ from, to, value: BigInt(value || 0), data });

                return { success: true, feeLimit: gas.toString() };
            } catch (error) {
                return {
                    success: false,
                    error: {
                        message: getErrorMessage(error, 'Gas estimation failed.'),
                        code: 'Backend_Error',
                    },
                };
            }
        };

        const resolveEvmNonce = async ({
            account,
        }: ResolveEvmNonceParams): Promise<ResolvedEvmNonce> => {
            const [pending, confirmed] = await Promise.all([
                client.getTransactionCount(account.descriptor, 'pending'),
                client.getTransactionCount(account.descriptor, 'latest'),
            ]);

            return { nonce: String(pending), confirmedNonce: String(confirmed) };
        };

        const evmSend = createEvmChainSend({
            getTrezorConnect: deps.getTrezorConnect,
            estimateEvmGasLimit,
            resolveEvmNonce,
            onEvmFeeEstimationFailed: deps.onEvmFeeEstimationFailed,
            // Runtime networks send the coin only: no approvals, tokens or private pending hints.
            isApprovalFlowSupported: () => false,
            getEvmPrivatePendingHint: () => undefined,
            isEvmTokenDefinitionKnown: () => Promise.resolve(false),
            push: async ({ account, serializedTx }) => {
                assertOwnAccount(account);
                await assertServedChain('push-failed');

                try {
                    return { txid: await client.sendRawTransaction(serializedTx) };
                } catch (error) {
                    throw new ChainSendError(
                        'push-failed',
                        symbol,
                        getErrorMessage(error, 'Broadcast failed.'),
                    );
                }
            },
        })({ decimals, displaySymbol: definition.nativeSymbol, chainId });

        const getFeeInfo = async (): Promise<FeeInfo> => {
            const [fees, blockHeight] = await Promise.all([
                client.estimateFeesPerGas(),
                client.getBlockNumber(),
            ]);
            const levels = toFeeLevels(fees);

            return {
                blockHeight: Number(blockHeight),
                blockTime: ASSUMED_BLOCK_TIME_SECONDS,
                minFee: 0,
                maxFee: Math.ceil(Number(levels[0]?.feePerUnit ?? 0) * 10),
                minPriorityFee: 0,
                levels,
            };
        };

        return {
            symbol,
            backendType: 'evm-rpc',
            syncPolicy: getChainSyncPolicy(DEFAULT_ACCOUNT_SYNC_INTERVAL),
            nativeAsset: { symbol: definition.nativeSymbol, name: definition.name },
            getAccountBalance: async ({ ref }) => {
                assertOwnAccount(ref);

                let wei: bigint;
                try {
                    wei = await client.getBalance(ref.descriptor);
                } catch {
                    throw new ChainNetworkError('account-info-failed', symbol);
                }
                const balance = subunitsToUnits(wei.toString(), decimals);

                return {
                    balance,
                    availableBalance: balance,
                    displayBalance: balance,
                    empty: wei === 0n,
                };
            },
            // Runtime networks have no rate source.
            getNativeFiatRate: () => Promise.resolve(null),
            getAccountFiatBalance: getDisplayBalanceFiatValue,
            getHistoricFiatRates: () => Promise.resolve({}),
            send: {
                composeFeeLevels: async params => {
                    assertOwnAccount(params.account);
                    await assertServedChain('compose-failed');

                    return await evmSend.composeFeeLevels(params);
                },
                prepareForReview: params => {
                    assertOwnAccount(params.account);

                    return evmSend.prepareForReview!(params);
                },
                sign: params => {
                    assertOwnAccount(params.account);

                    return evmSend.sign(params);
                },
                push: evmSend.push,
                createPendingTransaction: buildPendingTransaction,
                getFeeInfo,
            },
        };
    };
