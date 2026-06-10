import { fromWei, toWei } from 'web3-utils';

import { Calldata, isEvmClearSigningTx } from '@suite-common/calldata';
import { EVM_SPENDER_LABELS } from '@suite-common/suite-constants';
import { type TrezorDevice } from '@suite-common/suite-types';
import { EARN_YIELD_CLAIM_PROVIDER, networks } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type ReviewOutput,
    type ReviewOutputState,
    type StakeFormState,
    type StakeType,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import type { CardanoOutput } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { BigNumber, versionUtils } from '@trezor/utils';

import { datetimeToLocktime } from './bitcoinUtils';
import { getShortFingerprint, isCardanoTx } from './cardanoUtils';
import {
    isApprovalFlowSupported as isApprovalSupported,
    isEvmClearSigningSupported as isEvmClearSigningSupportedByDevice,
} from './deviceUtils';
import {
    getEvmTransactionTextSignature,
    isEvmApprovalTx,
    isEvmYieldTxByTextSignature,
} from './ethUtils';
import { getStakeType } from './ethereumStakingUtils';
import { isExchangeTradingForm } from './sendFormUtils';
import { isRbfBumpFeeTransaction } from './transactionUtils';

export const getTransactionReviewOutputState = (
    index: number,
    buttonRequestsCount: number,
): ReviewOutputState => {
    if (index === buttonRequestsCount - 1) return 'active';
    if (index < buttonRequestsCount - 1) return 'success';

    return undefined;
};

export const getIsUpdatedSendFlow = (device: TrezorDevice) => {
    const firmwareVersion = getFirmwareVersion(device);

    return versionUtils.isNewerOrEqual(firmwareVersion, '2.6.0');
};

export const getIsUpdatedEthereumSendFlow = (
    device: TrezorDevice,
    network: Account['networkType'],
    stakeType?: StakeType,
) => {
    if (network !== 'ethereum') return false;

    const firmwareVersion = getFirmwareVersion(device);

    // publicly introduced in 2.6.3, versions 2.6.1 and 2.6.2 were internal
    // staking uses new flow on T1B1
    return versionUtils.isNewer(firmwareVersion, '2.6.0') || !!stakeType;
};

const getIsUpdatedStellarSendFlow = (device: TrezorDevice, network: Account['networkType']) => {
    if (network !== 'stellar') return false;

    const firmwareVersion = getFirmwareVersion(device);

    return versionUtils.isNewer(firmwareVersion, '2.9.0');
};

const getCardanoTokenBundle = (account: Account, output: CardanoOutput) => {
    // Transforms cardano's tokenBundle into outputs, 1 output per one token
    // since suite supports only 1 token per output it will return just one item
    if (!output.tokenBundle || output.tokenBundle.length === 0 || 'addressParameters' in output)
        return undefined;

    if (account.tokens) {
        return output.tokenBundle
            .map(policyGroup =>
                policyGroup.tokenAmounts.map(token => {
                    const accountToken = account.tokens!.find(
                        currentToken =>
                            currentToken.contract ===
                            `${policyGroup.policyId}${token.assetNameBytes}`,
                    );
                    if (!accountToken) return;

                    const fingerprint = accountToken.name
                        ? getShortFingerprint(accountToken.name)
                        : undefined;

                    return {
                        standard: 'BLOCKFROST' as const,
                        contract: output.address,
                        balance: token.amount,
                        symbol: token.assetNameBytes
                            ? Buffer.from(token.assetNameBytes, 'hex').toString('utf8')
                            : fingerprint,
                        decimals: accountToken.decimals,
                    };
                }),
            )
            .flat();
    }
};

type ConstructOutputsParams = {
    precomposedTx: GeneralPrecomposedTransactionFinal;
    decreaseOutputId: number | undefined;
    account: Account;
    precomposedForm: FormState | StakeFormState;
    vaultName?: string;
    availableRewards?: YieldClaimReward[];
    swapSlippage?: string;
    isClearSignedTradingSwap: boolean;
};

type IsClearSignedEvmTradingSwapTransactionParams = {
    account: Account;
    device: TrezorDevice;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    transactionData?: string;
    trading?: FormState['trading'];
};

const getClearSignedSwapRecipientName = (
    precomposedTx: GeneralPrecomposedTransactionFinal,
    fallback: string,
): string => {
    const routerAddress = precomposedTx.outputs.find(
        o => 'address' in o && typeof o.address === 'string',
    )?.address as string | undefined;

    return (routerAddress && EVM_SPENDER_LABELS[routerAddress.toLowerCase()]) ?? fallback;
};

export const isClearSignedEvmTradingSwapTransaction = ({
    account,
    device,
    precomposedTx,
    transactionData,
    trading,
}: IsClearSignedEvmTradingSwapTransactionParams): boolean => {
    if (!isExchangeTradingForm(trading)) return false;
    if (!isEvmClearSigningSupportedByDevice(device)) return false;
    if (isEvmApprovalTx(transactionData)) return false;
    if (account.networkType !== 'ethereum' || !transactionData) return false;
    const network = networks[account.symbol];
    if (!('chainId' in network)) return false;
    const to = precomposedTx.outputs.find(
        o => 'address' in o && typeof o.address === 'string',
    )?.address;

    return isEvmClearSigningTx(network.chainId, to, transactionData);
};

const constructOldFlow = ({
    precomposedTx,
    decreaseOutputId,
    account,
    precomposedForm,
    isClearSignedTradingSwap,
}: ConstructOutputsParams): ReviewOutput[] => {
    const outputs: ReviewOutput[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const isStellar = account.networkType === 'stellar';
    const { networkType } = account;
    const evmTxType = getEvmTransactionTextSignature(precomposedForm.transactionData);
    const isYieldOperation = isEvmYieldTxByTextSignature(evmTxType);

    const hasDestinationTag = 'destinationTag' in precomposedForm;

    const isBumpFeeRbf = isRbfBumpFeeTransaction(precomposedTx);

    // used in the bump fee flow
    if (isBumpFeeRbf && precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid!,
            },
            {
                type: 'fee-replace',
                value: precomposedTx.feeDifference,
                value2: precomposedTx.fee,
            },
        );

        // add decrease output confirmation step between txid and fee
        if (typeof decreaseOutputId === 'number') {
            const { outputs: precomposedOutputs } = precomposedTx;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const decreasedOutput: (typeof precomposedOutputs)[number] =
                precomposedOutputs[decreaseOutputId];
            outputs.splice(1, 0, {
                type: 'reduce-output',
                label: decreasedOutput.address!,
                value: precomposedTx.feeDifference,
                value2: decreasedOutput.amount.toString(),
            });
        }
    } else if (isCardano) {
        precomposedTx.outputs.forEach(o => {
            // iterate only through "external" outputs (change output has addressParameters field instead of address)
            if ('address' in o) {
                const tokenBundle = getCardanoTokenBundle(account, o)?.[0]; // send form supports one token per output

                // each output will include certain amount of ADA (cardano token outputs require ADA)
                outputs.push({
                    type: 'regular_legacy',
                    value: o.address,
                });

                // if the output also includes a token then we need to render another row with the token
                if (tokenBundle) {
                    outputs.push({
                        type: 'amount',
                        label: o.address,
                        value: tokenBundle.balance ?? '0',
                        token: tokenBundle,
                    });
                } else {
                    outputs.push({
                        type: 'amount',
                        label: o.address,
                        value: o.amount,
                    });
                }
            }
        });
    } else if (isStellar) {
        outputs.push(
            {
                type: 'signing-with',
                value: account.descriptor,
            },
            {
                type: 'destination-tag',
                value: precomposedForm.destinationTag || '',
            },
            {
                type: 'timebounds',
                value: '',
            },
        );
        precomposedTx.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                outputs.push(
                    { type: 'address', value: o.address },
                    {
                        type: 'amount',
                        value: o.amount.toString(),
                        token: precomposedTx.token,
                    },
                );
                outputs.push();
            }
        });
    } else {
        precomposedTx.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                outputs.push({
                    type: 'regular_legacy',
                    value: o.address,
                });
            } else if (o.script_type === 'PAYTOOPRETURN') {
                outputs.push({
                    type: 'opreturn',
                    value: o.op_return_data,
                });
            }
        });
    }

    if (precomposedForm.bitcoinLocktimeBlockHeight) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLocktimeBlockHeight });
    } else if (precomposedForm.bitcoinLocktimeDatetime) {
        const locktime = datetimeToLocktime(precomposedForm.bitcoinLocktimeDatetime);
        if (locktime)
            outputs.push({
                type: 'locktime',
                value: locktime.toString(),
            });
    }

    if (networkType === 'tron' && precomposedForm.destinationTag) {
        outputs.push({ type: 'note', value: precomposedForm.destinationTag });
    } else if (
        precomposedForm.transactionData &&
        (!precomposedTx.token || isYieldOperation) &&
        !isClearSignedTradingSwap
    ) {
        outputs.push({ type: 'data', value: precomposedForm.transactionData });
    }

    // For bump fee we have to analyze tx data,
    // so outputs must already include type 'data' beforehand
    const stakeType = getStakeType(precomposedForm, outputs);

    if (networkType === 'ripple') {
        // ripple displays requests on device in different order:
        // 1. destination tag
        // 2. fee
        // 3. output
        outputs.unshift({ type: 'fee', value: precomposedTx.fee });
        if (hasDestinationTag && precomposedForm.destinationTag) {
            outputs.unshift({
                type: 'destination-tag',
                value: precomposedForm.destinationTag,
            });
        }
    } else if ((!isBumpFeeRbf || !precomposedTx.useNativeRbf) && !stakeType && !isYieldOperation) {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
    }

    return outputs;
};

const constructNewFlow = ({
    precomposedTx,
    decreaseOutputId,
    account,
    precomposedForm,
    vaultName,
    availableRewards,
    swapSlippage,
    isClearSignedTradingSwap,
    isApprovalFlowSupported,
    isEvmClearSigningSupported,
    isUpdatedEthereumSendFlow,
    isUpdatedStellarSendFlow,
}: ConstructOutputsParams & {
    isUpdatedEthereumSendFlow: boolean;
    isUpdatedStellarSendFlow: boolean;
    isApprovalFlowSupported: boolean;
    isEvmClearSigningSupported: boolean;
}): ReviewOutput[] => {
    const outputs: ReviewOutput[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const isSolana = account.networkType === 'solana';
    const isStellar = account.networkType === 'stellar';
    const isTron = account.networkType === 'tron';
    const isTronStakeFreeze = isTron && Boolean(precomposedForm.tronStakeResource);
    const isTronStakeVote = isTron && precomposedForm.tronStakeVotes !== undefined;
    const evmApprovalTxData = Calldata.evm.erc20.approve.decode(precomposedForm.transactionData);
    const isEvmApproval = isEvmApprovalTx(precomposedForm.transactionData);
    const stakeType = getStakeType(precomposedForm, outputs);

    const { networkType, symbol } = account;

    const hasDestinationTag = 'destinationTag' in precomposedForm;
    const trading = precomposedForm?.trading;

    const evmTxType = getEvmTransactionTextSignature(precomposedForm.transactionData);
    const isClaimOp = evmTxType === 'claim';
    const isYieldOp = isEvmYieldTxByTextSignature(evmTxType);
    const isEvmClaimClearSign = isUpdatedEthereumSendFlow && isEvmClearSigningSupported;

    if (isClaimOp && isEvmClaimClearSign) {
        outputs.push(
            { type: 'data', value: EARN_YIELD_CLAIM_PROVIDER },
            { type: 'rewards', rewards: availableRewards ?? [] },
        );

        return outputs;
    }

    if (isYieldOp && isUpdatedEthereumSendFlow) {
        const fallbackAddress = precomposedTx.outputs.find(
            o => 'address' in o && typeof o.address === 'string',
        )?.address;
        const resolvedVaultName = vaultName ?? fallbackAddress ?? '';

        outputs.push({ type: 'data', value: '' }, { type: 'address', value: resolvedVaultName });

        precomposedTx.outputs.forEach(o => {
            if ('address' in o && typeof o.address === 'string') {
                outputs.push({
                    type: 'amount',
                    value: o.amount.toString(),
                    value2: networks[symbol].name,
                    token: precomposedTx.token,
                });
            }
        });

        return outputs;
    }

    if (isTronStakeVote) {
        precomposedTx.outputs.forEach(o => {
            if ('address' in o && typeof o.address === 'string') {
                outputs.push({
                    type: 'tron-vote',
                    value: o.address,
                    value2: precomposedForm.tronStakeVotes,
                });
            }
        });

        return outputs;
    }

    if (networkType === 'stellar') {
        if (!isUpdatedStellarSendFlow) {
            outputs.push({
                type: 'signing-with',
                value: account.descriptor,
            });
            if (account.symbol === 'txlm') {
                outputs.push({
                    type: 'network',
                    value: '',
                });
            }
            outputs.push({
                type: 'timebounds',
                value: '',
            });
        }

        outputs.push({
            type: 'destination-tag',
            value: precomposedForm.destinationTag || '',
        });
    }

    if (isTron && precomposedForm.destinationTag) {
        outputs.push({ type: 'note', value: precomposedForm.destinationTag });
    } else if (
        ((precomposedForm.transactionData && !precomposedTx.token && !isEvmApproval) ||
            (precomposedForm.transactionData && isEvmApproval && !isApprovalFlowSupported) ||
            (precomposedForm.transactionData && isYieldOp && !isUpdatedEthereumSendFlow) ||
            (precomposedForm.transactionData && isClaimOp && !isEvmClaimClearSign)) &&
        !isClearSignedTradingSwap
    ) {
        outputs.push({ type: 'data', value: precomposedForm.transactionData });
    }

    const isRbf = isRbfBumpFeeTransaction(precomposedTx);

    // used in the bump fee flow
    if (isRbf && precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid!,
            },
            {
                type: 'fee-replace',
                value: precomposedTx.feeDifference,
                value2: precomposedTx.fee,
            },
        );

        // add decrease output confirmation step between txid and fee
        if (typeof decreaseOutputId === 'number') {
            const { outputs: precomposedOutputs } = precomposedTx;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const decreasedOutput: (typeof precomposedOutputs)[number] =
                precomposedOutputs[decreaseOutputId];
            outputs.splice(1, 0, {
                type: 'reduce-output',
                label: decreasedOutput.address!,
                value: precomposedTx.feeDifference,
                value2: decreasedOutput.amount.toString(),
            });
        }
    } else if (isCardano) {
        precomposedTx.outputs.forEach(o => {
            // iterate only through "external" outputs (change output has addressParameters field instead of address)
            if ('address' in o) {
                const tokenBundle = getCardanoTokenBundle(account, o)?.[0]; // send form supports one token per output

                // each output will include certain amount of ADA (cardano token outputs require ADA)
                outputs.push({
                    type: 'regular_legacy',
                    value: o.address,
                });

                // if the output also includes a token then we need to render another row with the token
                if (tokenBundle) {
                    outputs.push({
                        type: 'amount',
                        label: o.address,
                        value: tokenBundle.balance ?? '0',
                        token: tokenBundle,
                    });
                } else if (!stakeType) {
                    outputs.push({
                        type: 'amount',
                        label: o.address,
                        value: o.amount,
                    });
                }
            }
        });
    } else if (
        (precomposedForm.trading?.isSlip24Active || isClearSignedTradingSwap) &&
        isExchangeTradingForm(trading)
    ) {
        const recipientName = isClearSignedTradingSwap
            ? getClearSignedSwapRecipientName(precomposedTx, trading.recipientName)
            : trading.recipientName;

        if (recipientName) {
            outputs.push({ type: 'recipient_name', value: recipientName });
        }
        if (isClearSignedTradingSwap) {
            outputs.push({ type: 'swap_intent', value: 'swap' });
        }
        // TODO: extract the receive amount directly from the actual transaction data
        // instead of deriving it from the quote and slippage.
        const receive =
            isClearSignedTradingSwap && swapSlippage
                ? {
                      ...trading.receive,
                      amount: new BigNumber(trading.receive.amount)
                          .multipliedBy(new BigNumber(100).minus(swapSlippage))
                          .dividedBy(100)
                          .toString(),
                  }
                : trading.receive;
        outputs.push({
            type: 'traded_assets',
            value: '',
            value2: '',
            send: trading.send,
            receive,
            receiveAddress: isClearSignedTradingSwap ? trading.receiveAddress : undefined,
        });
    } else {
        precomposedTx.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                const tokenOutput: ReviewOutput = {
                    type: 'contract',
                    value: precomposedTx.token ? precomposedTx.token.contract : '',
                };

                // this is displayed only for tokens without definitions
                if (
                    precomposedTx.token &&
                    !precomposedTx.isTokenKnown &&
                    !isSolana &&
                    !isStellar &&
                    !isTron
                ) {
                    outputs.push(tokenOutput);
                    outputs.push({ type: 'address', value: o.address });
                } else if (
                    !isTron &&
                    ((precomposedForm.transactionData && !isEvmApproval) ||
                        (isEvmApproval && !isApprovalFlowSupported))
                ) {
                    // EVM contract call
                    outputs.push({ type: 'contract', value: o.address });
                } else {
                    // regular transfer
                    outputs.push({ type: 'address', value: o.address });
                }

                if (!isSolana && !isUpdatedEthereumSendFlow && !isTronStakeFreeze) {
                    outputs.push({
                        type: 'amount',
                        value: o.amount.toString(),
                        token: precomposedTx.token,
                    });
                }

                // Solana tokens are displayed *after* the address
                if (precomposedTx.token && !precomposedTx.isTokenKnown && isSolana) {
                    outputs.push(tokenOutput);
                }
            } else if (o.script_type === 'PAYTOOPRETURN') {
                outputs.push({
                    type: 'opreturn',
                    value: o.op_return_data,
                });
            }
        });
    }

    if (evmApprovalTxData && networkType === 'ethereum' && isApprovalFlowSupported) {
        const { spender } = evmApprovalTxData;
        outputs.push({
            type: 'contract',
            value: vaultName ?? EVM_SPENDER_LABELS[spender] ?? spender,
        });

        if (precomposedTx.token) {
            outputs.push({
                type: 'approve_data',
                value: evmApprovalTxData.amount.toString(),
                value2: networks[symbol].name,
                token: precomposedTx.token,
            });
        }
    }

    if (networkType === 'ethereum' && !isUpdatedEthereumSendFlow) {
        // device shows ether, precomposedTx.feePerByte is in gwei
        const wei = toWei(precomposedTx.feePerByte, 'gwei'); // from gwei to wei
        const ether = fromWei(wei, 'ether'); // from wei to ether

        outputs.push({
            type: 'gas',
            value: ether,
        });
    }

    if (precomposedForm.bitcoinLocktimeBlockHeight) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLocktimeBlockHeight });
    } else if (precomposedForm.bitcoinLocktimeDatetime) {
        const locktime = datetimeToLocktime(precomposedForm.bitcoinLocktimeDatetime);
        if (locktime)
            outputs.push({
                type: 'locktime',
                value: locktime.toString(),
            });
    }

    if (isTron && precomposedTx.token) {
        const feeLimitValue =
            'feeLimit' in precomposedForm && precomposedForm.feeLimit
                ? precomposedForm.feeLimit
                : (precomposedTx.estimatedFeeLimit ?? precomposedTx.fee);
        outputs.push({ type: 'fee-limit', value: feeLimitValue });
    }

    if (networkType === 'ripple' && hasDestinationTag && precomposedForm.destinationTag) {
        outputs.unshift({
            type: 'destination-tag',
            value: precomposedForm.destinationTag,
        });
    }

    if (isSolana && precomposedForm.destinationTag) {
        outputs.push({
            type: 'destination-tag',
            value: precomposedForm.destinationTag,
        });
    }

    return outputs;
};

type ConstructTransactionReviewOutputsProps = Omit<
    ConstructOutputsParams,
    'isClearSignedTradingSwap'
> & {
    device: TrezorDevice;
};

export const constructTransactionReviewOutputs = ({
    device,
    ...params
}: ConstructTransactionReviewOutputsProps): ReviewOutput[] => {
    const isUpdatedSendFlow = getIsUpdatedSendFlow(device); // >= 2.6.0
    const isUpdatedEthereumSendFlow = getIsUpdatedEthereumSendFlow(
        device,
        params.account.networkType,
    ); // > 2.6.0 && isEthereum
    const isUpdatedStellarSendFlow = getIsUpdatedStellarSendFlow(
        device,
        params.account.networkType,
    ); // > 2.9.0 && isStellar
    const isClearSignedTradingSwap = isClearSignedEvmTradingSwapTransaction({
        account: params.account,
        device,
        precomposedTx: params.precomposedTx,
        transactionData: params.precomposedForm.transactionData,
        trading: params.precomposedForm.trading,
    });
    if (!isUpdatedSendFlow) {
        return constructOldFlow({ ...params, isClearSignedTradingSwap });
    }

    return constructNewFlow({
        ...params,
        isClearSignedTradingSwap,
        isUpdatedEthereumSendFlow,
        isApprovalFlowSupported: isApprovalSupported(device),
        isEvmClearSigningSupported: isEvmClearSigningSupportedByDevice(device),
        isUpdatedStellarSendFlow,
    });
};

export const constructTransactionReviewOutputsOptional = ({
    account,
    availableRewards,
    decreaseOutputId,
    device,
    precomposedForm,
    precomposedTx,
    vaultName,
    swapSlippage,
}: Partial<ConstructTransactionReviewOutputsProps>): ReviewOutput[] => {
    if (
        account === undefined ||
        device === undefined ||
        precomposedForm === undefined ||
        precomposedTx === undefined
    ) {
        return [];
    }

    return constructTransactionReviewOutputs({
        account,
        availableRewards,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
        vaultName,
        swapSlippage,
    });
};
