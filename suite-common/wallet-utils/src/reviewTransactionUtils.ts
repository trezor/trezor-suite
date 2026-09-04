import {
    Calldata,
    type ClearSigningCoverage,
    getEvmClearSignedSwapCoverage,
    isEvmClearSigningTx,
} from '@suite-common/calldata';
import { EVM_SPENDER_LABELS } from '@suite-common/suite-constants';
import { type TrezorDevice } from '@suite-common/suite-types';
import { EARN_YIELD_CLAIM_PROVIDER, networks } from '@suite-common/wallet-config';
import { WRAPPED_NATIVE_MIN_FIRMWARE } from '@suite-common/wallet-constants';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransaction,
    type GeneralPrecomposedTransactionFinal,
    type ReviewOutput,
    type ReviewOutputState,
    type StakeFormState,
    type StakeType,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import type { CardanoOutput } from '@trezor/connect';
import { getFirmwareVersion, getFirmwareVersionArray } from '@trezor/device-utils';
import { getWrappedNativeSymbol } from '@trezor/network-ethereum-suite-common';
import { BigNumber, versionUtils } from '@trezor/utils';

import { datetimeToLocktime } from './bitcoinUtils';
import { getShortFingerprint, isCardanoTx } from './cardanoUtils';
import {
    isApprovalFlowSupported as isApprovalSupported,
    isEvmClearSigningSupported as isEvmClearSigningSupportedByDevice,
} from './deviceUtils';
import { fromGwei, fromWei } from './ethConverter';
import {
    getEvmTransactionPurpose,
    isEvmApprovalTx,
    isEvmYieldTxByTextSignature,
    isUnwrapNativeTx,
    isWrapNativeTx,
} from './ethUtils';
import { isExchangeTradingForm } from './sendFormUtils';
import { getStakeType } from './stakingUtils';
import { isRbfBumpFeeTransaction } from './transactionUtils';

/**
 * Transactions whose steps cannot be recreated in Suite (e.g. Solana split unstakes) are not broken
 * down into review outputs, Suite only asks the user to follow the instructions on the device.
 */
export const isDeviceReviewOnlyTransaction = (transaction?: GeneralPrecomposedTransaction) =>
    transaction !== undefined &&
    'isDeviceReviewOnly' in transaction &&
    transaction.isDeviceReviewOnly === true;

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

const isValidTxData = (transactionData?: string): transactionData is string => {
    if (typeof transactionData !== 'string') return false;

    const normalizedTransactionData = transactionData.trim().toLowerCase();

    return normalizedTransactionData !== '' && normalizedTransactionData !== '0x';
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
    // undefined when the device will not clear-sign the transaction as a swap
    clearSignedSwapCoverage: ClearSigningCoverage | undefined;
};

type ClearSignedEvmTradingSwapParams = {
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
    )?.address;

    return (routerAddress && EVM_SPENDER_LABELS[routerAddress.toLowerCase()]) ?? fallback;
};

export const getClearSignedEvmTradingSwapCoverage = ({
    account,
    device,
    precomposedTx,
    transactionData,
    trading,
}: ClearSignedEvmTradingSwapParams): ClearSigningCoverage | undefined => {
    if (
        !isExchangeTradingForm(trading) ||
        !isEvmClearSigningSupportedByDevice(device) ||
        isEvmApprovalTx(transactionData) ||
        account.networkType !== 'ethereum' ||
        !transactionData
    ) {
        return undefined;
    }
    const network = networks[account.symbol];
    if (!('chainId' in network)) {
        return undefined;
    }
    const to = precomposedTx.outputs.find(
        o => 'address' in o && typeof o.address === 'string',
    )?.address;

    return getEvmClearSignedSwapCoverage(
        network.chainId,
        to,
        transactionData,
        getFirmwareVersion(device),
    );
};

export const isClearSignedEvmTradingSwapTransaction = (
    params: ClearSignedEvmTradingSwapParams,
): boolean => getClearSignedEvmTradingSwapCoverage(params) !== undefined;

type ClearSignedWrappedNativeParams = {
    account: Account;
    device: TrezorDevice;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    transactionData?: string;
};

/**
 * Whether the device will clear-sign this transaction as a canonical WETH wrap/unwrap
 * (deposit()/withdraw()), which it renders as provider → intent → amount → fee summary. Gated on
 * `isEvmClearSigningTx` so a wrapped native the firmware does not clear-sign (e.g. WBNB on BSC)
 * still falls through to the blind-signing rows.
 *
 * The `evmClearSigning` capability is not sufficient on its own: connect reports it from 2.12.1,
 * while WETH gained its clear-signing definition in 2.12.4. Without the version gate a device on
 * 2.12.1–2.12.3 would get the mirrored review while it actually blind-signs — the same
 * modal/device mismatch this mirroring exists to remove, inverted.
 */
export const isClearSignedWrappedNativeTransaction = ({
    account,
    device,
    precomposedTx,
    transactionData,
}: ClearSignedWrappedNativeParams): boolean => {
    if (account.networkType !== 'ethereum' || !isEvmClearSigningSupportedByDevice(device)) {
        return false;
    }

    const firmwareVersion = getFirmwareVersionArray(device);
    if (
        firmwareVersion === null ||
        !versionUtils.isNewerOrEqual(firmwareVersion, WRAPPED_NATIVE_MIN_FIRMWARE)
    ) {
        return false;
    }

    const network = networks[account.symbol];
    if (!('chainId' in network)) {
        return false;
    }

    const to = precomposedTx.outputs.find(
        o => 'address' in o && typeof o.address === 'string',
    )?.address;
    const wrappedNativeTxParams = {
        networkSymbol: account.symbol,
        to,
        data: transactionData,
    };

    return (
        (isWrapNativeTx(wrappedNativeTxParams) || isUnwrapNativeTx(wrappedNativeTxParams)) &&
        isEvmClearSigningTx(network.chainId, to, transactionData)
    );
};

const constructOldFlow = ({
    precomposedTx,
    decreaseOutputId,
    account,
    precomposedForm,
    clearSignedSwapCoverage,
}: ConstructOutputsParams): ReviewOutput[] => {
    const isClearSignedTradingSwap = clearSignedSwapCoverage !== undefined;
    const outputs: ReviewOutput[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const isStellar = account.networkType === 'stellar';
    const { networkType } = account;

    const evmTxType = getEvmTransactionPurpose({
        networkSymbol: account.symbol,
        to: precomposedTx.outputs.find(o => 'address' in o && typeof o.address === 'string')
            ?.address,
        data: precomposedForm.transactionData,
    });

    const isYieldOperation =
        isEvmYieldTxByTextSignature(evmTxType) ||
        evmTxType === 'wrap' ||
        evmTxType === 'unwrap' ||
        evmTxType === 'claim';

    const hasDestinationTag = 'destinationTag' in precomposedForm;

    const isBumpFeeRbf = isRbfBumpFeeTransaction(precomposedTx);

    // used in the bump fee flow
    if (isBumpFeeRbf && precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid,
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
        isValidTxData(precomposedForm.transactionData) &&
        (!precomposedTx.token || isYieldOperation) &&
        !isClearSignedTradingSwap
    ) {
        outputs.push({ type: 'data', value: precomposedForm.transactionData });
    }

    const stakeType = getStakeType(precomposedForm);

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
    clearSignedSwapCoverage,
    isClearSignedWrapUnwrap,
    isApprovalFlowSupported,
    isEvmClearSigningSupported,
    isUpdatedEthereumSendFlow,
    isUpdatedStellarSendFlow,
}: ConstructOutputsParams & {
    isClearSignedWrapUnwrap: boolean;
    isUpdatedEthereumSendFlow: boolean;
    isUpdatedStellarSendFlow: boolean;
    isApprovalFlowSupported: boolean;
    isEvmClearSigningSupported: boolean;
}): ReviewOutput[] => {
    const isClearSignedTradingSwap = clearSignedSwapCoverage !== undefined;
    const outputs: ReviewOutput[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const isSolana = account.networkType === 'solana';
    const isStellar = account.networkType === 'stellar';
    const isTron = account.networkType === 'tron';
    const tronStaking = isTron ? precomposedForm.tronStaking : undefined;
    const isTronStakeFreeze = tronStaking?.kind === 'freeze' || tronStaking?.kind === 'unstake';
    const evmApprovalTxData = Calldata.evm.erc20.approve.decode(precomposedForm.transactionData);
    const isEvmApproval = isEvmApprovalTx(precomposedForm.transactionData);
    const stakeType = getStakeType(precomposedForm);

    const { networkType, symbol } = account;

    const hasDestinationTag = 'destinationTag' in precomposedForm;
    const trading = precomposedForm?.trading;

    // Resolved from the full context rather than the calldata alone, so that the WETH
    // deposit()/withdraw() selectors classify as wrap/unwrap instead of 'unknown'.
    const evmTxType = getEvmTransactionPurpose({
        networkSymbol: symbol,
        to: precomposedTx.outputs.find(o => 'address' in o && typeof o.address === 'string')
            ?.address,
        data: precomposedForm.transactionData,
    });
    const isClaimOp = evmTxType === 'claim';
    const isYieldOp = isEvmYieldTxByTextSignature(evmTxType);
    const isEvmClaimClearSign = isUpdatedEthereumSendFlow && isEvmClearSigningSupported;

    if (networkType === 'ethereum' && stakeType && isUpdatedEthereumSendFlow) {
        // The firmware clear-signs staking operations as a single confirmation screen followed
        // by the amount/fee summary, so the review consists of one output only.
        precomposedTx.outputs.forEach(o => {
            if ('address' in o && typeof o.address === 'string') {
                outputs.push({ type: 'address', value: o.address });
            }
        });

        return outputs;
    }

    if (isClearSignedWrapUnwrap) {
        // The firmware walks a clear-signed wrap/unwrap through four screens — provider, intent,
        // the amount, then the fee summary (`confirm_ethereum_clear_signing`). Mirror them 1:1
        // (the summary is the review's own total row) so the modal's step pill tracks what is
        // actually on the device.
        outputs.push(
            { type: 'recipient_name', value: getWrappedNativeSymbol(symbol) ?? '' },
            { type: 'contract_intent', value: '' },
        );

        precomposedTx.outputs.forEach(o => {
            if ('address' in o && typeof o.address === 'string') {
                // Deliberately no `token`: wrapping is 1:1 and the device renders both legs with
                // the native currency formatter, so passing the WETH token info would make an
                // unwrap read "WETH" where the device says "ETH".
                outputs.push({ type: 'amount', value: o.amount.toString() });
            }
        });

        return outputs;
    }

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

    if (tronStaking?.kind === 'vote') {
        precomposedTx.outputs.forEach(o => {
            if ('address' in o && typeof o.address === 'string') {
                outputs.push({
                    type: 'tron-vote',
                    value: o.address,
                    value2: tronStaking.votes,
                });
            }
        });

        return outputs;
    }

    if (tronStaking?.kind === 'withdraw') {
        outputs.push({ type: 'tron-withdraw', value: account.descriptor });

        return outputs;
    }

    if (tronStaking?.kind === 'claim') {
        outputs.push({ type: 'tron-claim', value: '' });

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
        ((isValidTxData(precomposedForm.transactionData) &&
            !precomposedTx.token &&
            !isEvmApproval) ||
            (isValidTxData(precomposedForm.transactionData) &&
                isEvmApproval &&
                !isApprovalFlowSupported) ||
            (isValidTxData(precomposedForm.transactionData) &&
                isYieldOp &&
                !isUpdatedEthereumSendFlow) ||
            (isValidTxData(precomposedForm.transactionData) &&
                isClaimOp &&
                !isEvmClaimClearSign)) &&
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
                value: precomposedTx.prevTxid,
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

        const isPartialClearSignedSwap = clearSignedSwapCoverage === 'partial';
        // TODO: extract the receive amount directly from the actual transaction data
        // instead of deriving it from the quote and slippage.
        const slippageAdjustedReceive =
            isClearSignedTradingSwap && swapSlippage
                ? {
                      ...trading.receive,
                      amount: new BigNumber(trading.receive.amount)
                          .multipliedBy(new BigNumber(100).minus(swapSlippage))
                          .dividedBy(100)
                          .toString(),
                  }
                : trading.receive;
        const receive = isPartialClearSignedSwap ? undefined : slippageAdjustedReceive;
        outputs.push({
            type: 'traded_assets',
            value: '',
            value2: '',
            send: trading.send,
            receive,
            receiveAddress: clearSignedSwapCoverage === 'full' ? trading.receiveAddress : undefined,
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
                    !isTron &&
                    !(isEvmApproval && isApprovalFlowSupported)
                ) {
                    outputs.push(tokenOutput);
                    outputs.push({ type: 'address', value: o.address });
                } else if (
                    networkType === 'ethereum' &&
                    ((isValidTxData(precomposedForm.transactionData) && !isEvmApproval) ||
                        (isValidTxData(precomposedForm.transactionData) &&
                            isEvmApproval &&
                            !isApprovalFlowSupported))
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
        const wei = fromGwei(precomposedTx.feePerByte).toWei(); // from gwei to wei
        const ether = fromWei(wei).toEther(); // from wei to ether

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
    'clearSignedSwapCoverage'
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
    const clearSignedSwapCoverage = getClearSignedEvmTradingSwapCoverage({
        account: params.account,
        device,
        precomposedTx: params.precomposedTx,
        transactionData: params.precomposedForm.transactionData,
        trading: params.precomposedForm.trading,
    });
    if (!isUpdatedSendFlow) {
        return constructOldFlow({ ...params, clearSignedSwapCoverage });
    }

    return constructNewFlow({
        ...params,
        clearSignedSwapCoverage,
        // Firmware that predates the updated send flow cannot clear-sign at all, so this is
        // resolved only for the new flow.
        isClearSignedWrapUnwrap: isClearSignedWrappedNativeTransaction({
            account: params.account,
            device,
            precomposedTx: params.precomposedTx,
            transactionData: params.precomposedForm.transactionData,
        }),
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
