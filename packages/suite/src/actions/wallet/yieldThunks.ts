import { fromWei } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectAddressDisplayType } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type TransactionDto,
    type YieldDto,
    enterYield,
    exitYield,
    parseUnsignedEvmTransactionForSigning,
    submitTransactionHash,
    verifyEnterTransactions,
    verifyExitTransactions,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getContractAddressForNetworkSymbol,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import type {
    YieldFlowDisplayToken,
    YieldFlowToken,
    YieldFlowType,
} from 'src/components/earn/yield/types';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldRevokeModalParams,
    getYieldSpenderFromTransactions,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
} from 'src/components/earn/yield/yieldFlowUtils';
import { selectYieldSession } from 'src/components/earn/yield/yieldSelectors';
import { YIELD_PREFIX, yieldActions } from 'src/reducers/wallet/yieldReducer';
import type { AppState, Dispatch } from 'src/types/suite';

const YIELD_THUNK_PREFIX = `${YIELD_PREFIX}/thunk`;
const YIELD_GENERIC_ERROR = 'TR_EARN_YIELD_ERROR_GENERIC';

type YieldFlowResolvedData = {
    account: Account;
    vault: YieldDto;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
};

type EvmAccount = Extract<Account, { networkType: 'ethereum' }>;

type YieldSessionPayload = {
    flowType: YieldFlowType;
    flowKey: string;
};

type YieldSessionDataPayload = YieldSessionPayload & {
    flowData: YieldFlowResolvedData;
};

type YieldSessionDataAmountPayload = YieldSessionDataPayload & {
    amount: string;
};

type SetYieldGenericErrorParams = YieldSessionPayload & {
    dispatch: Dispatch;
};

type GetApprovalContractAddressParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
};

type GetApprovalRequestAmountParams = GetApprovalContractAddressParams & {
    amount: string;
};

type OpenYieldApproveModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    amount: string;
    spender: string;
    transactionId?: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
};

type OpenYieldRevokeModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    approveAmount: string;
    lastApprovedAmount: string;
    transactions: TransactionDto[] | null;
    fallbackSpender?: string | null;
};

type SubmitYieldOpportunityParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
};

const setYieldGenericError = ({ dispatch, flowType, flowKey }: SetYieldGenericErrorParams) => {
    dispatch(
        yieldActions.setError({
            flowType,
            flowKey,
            error: YIELD_GENERIC_ERROR,
        }),
    );
};

const getApprovalContractAddress = ({ flowType, flowData }: GetApprovalContractAddressParams) =>
    flowType === 'supply'
        ? (flowData.token.contractAddress ?? undefined)
        : (flowData.receiptToken.contractAddress ?? undefined);

const getApprovalRequestAmount = ({
    flowType,
    amount,
    flowData,
}: GetApprovalRequestAmountParams) => {
    if (flowType === 'supply') {
        return amount;
    }

    return getWithdrawRequestAmount({
        networkSymbol: flowData.account.symbol,
        amount,
        token: flowData.token,
        receiptToken: flowData.receiptToken,
        pricePerShare: flowData.vault.state?.pricePerShareState?.price,
    });
};

const getRevokeModalAmount = ({ flowType, amount, flowData }: GetApprovalRequestAmountParams) =>
    getApprovalRequestAmount({ flowType, amount, flowData }) ?? amount;

const openYieldApproveModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    spender,
    transactionId,
    preapprovedAmount,
    txType,
}: OpenYieldApproveModalParams) => {
    const contractAddress = getApprovalContractAddress({ flowType, flowData });

    if (!contractAddress) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    dispatch(
        yieldActions.openApprovalModal({
            flowType,
            flowKey,
            modalState: {
                amount,
                contractAddress,
                spender,
                providerId: flowData.vault.providerId,
                preapprovedAmount,
                txType,
            },
            txHashTransactionId: transactionId ?? null,
        }),
    );

    return true;
};

const openYieldRevokeModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    approveAmount,
    lastApprovedAmount,
    transactions,
    fallbackSpender,
}: OpenYieldRevokeModalParams) => {
    const revokeModalParams = transactions ? getYieldRevokeModalParams(transactions) : null;
    const spender =
        revokeModalParams?.spender ??
        (transactions ? getYieldSpenderFromTransactions(transactions) : null) ??
        fallbackSpender;

    dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));

    if (!spender) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    return openYieldApproveModal({
        dispatch,
        flowKey,
        flowType,
        flowData,
        amount: getRevokeModalAmount({ flowType, amount: approveAmount, flowData }),
        spender,
        transactionId: revokeModalParams?.transactionId,
        preapprovedAmount: lastApprovedAmount || undefined,
        txType: revokeModalParams ? 'revoke' : 'revoke-only',
    });
};

const submitYieldOpportunity = async ({
    flowType,
    flowData,
    amount,
}: SubmitYieldOpportunityParams) => {
    switch (flowType) {
        case 'supply': {
            const response = await enterYield({
                yieldId: flowData.vault.id,
                address: flowData.account.descriptor,
                arguments: { amount },
            });
            const verification = verifyEnterTransactions(response, {
                yieldId: flowData.vault.id,
                address: flowData.account.descriptor,
                amount,
                decimals: flowData.token.decimals,
            });

            return { response, verification };
        }
        case 'withdraw': {
            const response = await exitYield({
                yieldId: flowData.vault.id,
                address: flowData.account.descriptor,
                arguments: { amount },
            });
            const verification = verifyExitTransactions(response, {
                yieldId: flowData.vault.id,
                address: flowData.account.descriptor,
            });

            return { response, verification };
        }
        default:
            return exhaustive(flowType);
    }
};

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

type BuildYieldReviewTokenParams = {
    token: YieldFlowDisplayToken;
    symbol: Account['symbol'];
};

type BuildYieldReviewStateParams = BuildYieldReviewTokenParams & {
    parsedTransaction: ParsedTransactionForSigning;
    amount: string;
};

type BuildYieldReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    transaction: TransactionDto;
    dispatch: Dispatch;
    getState: () => AppState;
};

const getTransactionForSigning = (
    parsedTransaction: ParsedTransactionForSigning,
): EthereumSignTransaction['transaction'] => {
    const commonTransactionFields = {
        to: parsedTransaction.to,
        value: parsedTransaction.value ?? '0x0',
        gasLimit: parsedTransaction.gasLimit,
        nonce: serializeNonce(parsedTransaction.nonce),
        data: parsedTransaction.data,
        chainId: parsedTransaction.chainId,
    };

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        return {
            ...commonTransactionFields,
            maxFeePerGas: parsedTransaction.maxFeePerGas,
            maxPriorityFeePerGas: parsedTransaction.maxPriorityFeePerGas,
        };
    }

    if (parsedTransaction.gasPrice) {
        return {
            ...commonTransactionFields,
            gasPrice: parsedTransaction.gasPrice,
            txType: parsedTransaction.type,
        };
    }

    throw new Error('Yield transaction gas parameters are missing.');
};

const toGweiAmount = (amount: bigint) => fromWei(amount.toString(), 'gwei');

const buildYieldReviewToken = ({
    token,
    symbol,
}: BuildYieldReviewTokenParams): TokenInfo | undefined => {
    if (!token.contractAddress) {
        return undefined;
    }

    return {
        standard: 'ERC20',
        contract: getContractAddressForNetworkSymbol(symbol, token.contractAddress),
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.symbol,
    };
};

const buildYieldReviewState = ({
    parsedTransaction,
    amount,
    token,
    symbol,
}: BuildYieldReviewStateParams): BuildYieldReviewStateResult => {
    const gasLimit = BigInt(parsedTransaction.gasLimit);
    const gasPriceWei = BigInt(
        parsedTransaction.maxFeePerGas ?? parsedTransaction.gasPrice ?? ('0x0' as `0x${string}`),
    );
    const feeWei = gasLimit * gasPriceWei;
    const reviewToken = buildYieldReviewToken({ token, symbol });
    const amountSubunits = convertAmountUnitsToSubunits(amount, token.decimals);
    let eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        eip1559ReviewFields = {
            maxFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxFeePerGas)),
            maxPriorityFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxPriorityFeePerGas)),
        };
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: parsedTransaction.to,
                amount,
                fiat: '',
                currency: { value: '', label: '' },
                token: reviewToken?.contract ?? null,
                dataHex: parsedTransaction.data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: parsedTransaction.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: feeWei.toString(),
        feePerByte: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        totalSpent: reviewToken ? amountSubunits : (BigInt(amountSubunits) + feeWei).toString(),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: parsedTransaction.to,
                amount: amountSubunits,
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return { formState, precomposedTransaction };
};

const sendYieldTransaction = async ({
    account,
    amount,
    token,
    transaction,
    dispatch,
    getState,
}: SendYieldTransactionParams) => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const parsedTransaction = parseUnsignedEvmTransactionForSigning(
        transaction.unsignedTransaction,
    );

    if (!parsedTransaction) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const transactionForSigning = getTransactionForSigning(parsedTransaction);
    const { formState, precomposedTransaction } = buildYieldReviewState({
        parsedTransaction,
        amount,
        token,
        symbol: account.symbol,
    });

    dispatch(
        yieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm: formState,
            accountKey: account.key,
        }),
    );

    try {
        dispatch(preserveModal());

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: (account as EvmAccount).path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            throw new Error(signingResponse.error.message);
        }

        dispatch(
            yieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            return;
        }

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: signingResponse.payload.serializedTx,
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        dispatch(closeModal());

        if (!pushResponse.success) {
            throw new Error(pushResponse.error.message);
        }

        return pushResponse.payload;
    } finally {
        dispatch(yieldActions.discardTransaction());
    }
};

export const handleYieldApproveSuccessTxidThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    async (
        { flowType, flowKey, txid }: YieldSessionPayload & { txid: string },
        { dispatch, getState },
    ) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));

        try {
            if (approval.submitTxHashTransactionId) {
                await submitTransactionHash(
                    { transactionId: approval.submitTxHashTransactionId },
                    { hash: txid },
                );
            }

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: approveTxType,
                        txid,
                        amount: approval.amount ?? '',
                    },
                }),
            );
            dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const handleYieldApproveCancelThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }: YieldSessionPayload, { dispatch }) => {
        dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
        dispatch(yieldActions.clearApprovalTransition({ flowType, flowKey }));
    },
);

export const submitYieldRevokeThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);

        dispatch(yieldActions.clearError({ flowType, flowKey }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: '0',
            });

            if (verification === 'failure') {
                throw new Error();
            }

            const { transactions } = response.data;
            const spender =
                getYieldRevokeModalParams(transactions)?.spender ??
                getYieldSpenderFromTransactions(transactions) ??
                approval.approvedSpender;

            dispatch(
                yieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender ?? null,
                    revokeTransactions: transactions,
                }),
            );

            openYieldRevokeModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                approveAmount: amount,
                lastApprovedAmount: approval.lastApprovedAmount,
                transactions,
                fallbackSpender: spender,
            });
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const submitYieldApproveThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitApprove`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch },
    ) => {
        const requestAmount = getApprovalRequestAmount({
            flowType,
            amount,
            flowData,
        });

        if (!requestAmount) {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return;
        }

        dispatch(yieldActions.startSubmittingApproval({ flowType, flowKey, amount }));

        try {
            if (flowType === 'withdraw') {
                // For withdraw, X = cancel modification (no on-chain revoke needed).
                dispatch(yieldActions.cancelModification({ flowType, flowKey }));

                return;
            }

            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: requestAmount,
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const approvalModalParams = getYieldApprovalModalParams(transactions);
            const revokeModalParams = getYieldRevokeModalParams(transactions);
            const spender = approvalModalParams?.spender ?? revokeModalParams?.spender ?? null;

            dispatch(
                yieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender,
                    revokeTransactions: transactions,
                }),
            );

            if (revokeModalParams) {
                dispatch(yieldActions.setRevokeRequired({ flowType, flowKey }));
            }

            if (!approvalModalParams) {
                dispatch(
                    yieldActions.completeApproval({
                        flowType,
                        flowKey,
                        amount,
                    }),
                );

                return;
            }

            openYieldApproveModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                amount: requestAmount,
                spender: approvalModalParams.spender,
                transactionId: approvalModalParams.transactionId,
                txType: 'approve',
            });
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(yieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);

export const submitYieldActionThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitAction`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const requestAmount = getApprovalRequestAmount({
            flowType,
            amount,
            flowData,
        });

        if (!requestAmount) {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return;
        }

        dispatch(yieldActions.startSubmittingAction({ flowType, flowKey, amount }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: requestAmount,
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const approvalModalParams = getYieldApprovalModalParams(transactions);

            if (approvalModalParams) {
                dispatch(
                    yieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: approvalModalParams.spender,
                        revokeTransactions: transactions,
                    }),
                );
                dispatch(yieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount: requestAmount,
                    spender: approvalModalParams.spender,
                    transactionId: approvalModalParams.transactionId,
                    txType: 'approve',
                });

                return;
            }

            const actionTransaction =
                flowType === 'supply'
                    ? getYieldSupplyTransaction(transactions)
                    : getYieldWithdrawTransaction(transactions);

            if (!actionTransaction?.id) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const result = await sendYieldTransaction({
                account: flowData.account,
                amount,
                token: flowData.token,
                transaction: actionTransaction,
                dispatch,
                getState,
            });

            if (!result) {
                return;
            }

            await submitTransactionHash(
                { transactionId: actionTransaction.id },
                { hash: result.txid },
            );

            dispatch(
                notificationsActions.addToast({
                    type: flowType === 'supply' ? 'tx-yield-supply' : 'tx-yield-withdraw',
                    formattedAmount: `${amount} ${flowData.token.symbol}`,
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            const receiptAmount =
                flowType === 'supply'
                    ? (getWithdrawRequestAmount({
                          networkSymbol: flowData.account.symbol,
                          amount,
                          token: flowData.token,
                          receiptToken: flowData.receiptToken,
                          pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                      }) ?? amount)
                    : requestAmount;

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                    },
                    receiptAmount,
                }),
            );
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(yieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
