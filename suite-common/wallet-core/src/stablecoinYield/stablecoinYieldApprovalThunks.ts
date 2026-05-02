import { type Dispatch } from '@reduxjs/toolkit';

import { Calldata } from '@suite-common/calldata';
import {
    type TransactionDto,
    type YieldDto,
    enterYield,
    exitYield,
    submitTransactionHash,
    verifyEnterTransactions,
    verifyExitTransactions,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { STABLECOIN_YIELD_PREFIX, stablecoinYieldActions } from './stablecoinYieldReducer';
import { selectStablecoinYieldSession } from './stablecoinYieldSelectors';
import type {
    YieldActionFlowType,
    YieldFlowDisplayToken,
    YieldFlowToken,
} from './stablecoinYieldTypes';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldRevokeModalParams,
    getYieldSpenderFromTransactions,
    getYieldVaultAddressFromTransactions,
} from './stablecoinYieldUtils';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;
const YIELD_GENERIC_ERROR = 'TR_EARN_YIELD_ERROR_GENERIC';
const UINT256_MAX = (1n << 256n) - 1n;

export type YieldFlowResolvedData = {
    account: Account;
    vault: YieldDto;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
};

export type YieldSessionPayload = {
    flowType: YieldActionFlowType;
    flowKey: string;
};

export type YieldSessionDataPayload = YieldSessionPayload & {
    flowData: YieldFlowResolvedData;
};

export type YieldSessionDataAmountPayload = YieldSessionDataPayload & {
    amount: string;
};

type InitYieldAllowancePayload = YieldSessionDataPayload & {
    flowType: 'supply';
};

type SetYieldGenericErrorParams = YieldSessionPayload & {
    dispatch: Dispatch;
};

type GetApprovalContractAddressParams = {
    flowType: YieldActionFlowType;
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
    preapprovedAmountIsUnlimited?: boolean;
    txType: 'approve' | 'revoke' | 'revoke-only';
};

type OpenYieldRevokeModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    approveAmount: string;
    allowanceAmount: string;
    allowanceAmountIsUnlimited: boolean;
    transactions: TransactionDto[] | null;
    fallbackSpender?: string | null;
};

export type SubmitYieldOpportunityParams = {
    flowType: YieldActionFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
};

export const setYieldGenericError = ({
    dispatch,
    flowType,
    flowKey,
}: SetYieldGenericErrorParams) => {
    dispatch(
        stablecoinYieldActions.setError({
            flowType,
            flowKey,
            error: YIELD_GENERIC_ERROR,
        }),
    );
};

export const getApprovalContractAddress = ({
    flowType,
    flowData,
}: GetApprovalContractAddressParams) =>
    flowType === 'supply'
        ? (flowData.token.contractAddress ?? undefined)
        : (flowData.receiptToken.contractAddress ?? undefined);

export const getApprovalRequestAmount = ({
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

export const getRevokeModalAmount = ({
    flowType,
    amount,
    flowData,
}: GetApprovalRequestAmountParams) =>
    getApprovalRequestAmount({ flowType, amount, flowData }) ?? amount;

const getVaultAddressFromYieldId = (yieldId: string) =>
    yieldId.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? null;

const getAllowanceSpender = (flowData: YieldFlowResolvedData) =>
    flowData.receiptToken.contractAddress ?? getVaultAddressFromYieldId(flowData.vault.id);

const decodeAllowance = (data: string, decimals: number) => {
    const allowance = BigInt(data);
    const amountSubunits = allowance.toString();

    return {
        amount: convertAmountSubunitsToUnits(amountSubunits, decimals),
        isUnlimited: allowance === UINT256_MAX,
    };
};

const getYieldAllowanceAmount = async ({
    flowData,
}: Pick<InitYieldAllowancePayload, 'flowData'>) => {
    const spender = getAllowanceSpender(flowData);
    const tokenContractAddress = flowData.token.contractAddress;

    if (!spender || !tokenContractAddress) {
        throw new Error(
            'Yield allowance cannot be initialized without spender and token contract.',
        );
    }

    const allowanceCalldata = Calldata.evm.erc20.allowance({
        owner: flowData.account.descriptor,
        spender,
    });

    if (!allowanceCalldata.data) {
        throw new Error('Yield allowance calldata could not be built.');
    }

    const response = await TrezorConnect.blockchainEvmRpcCall({
        coin: flowData.account.symbol,
        from: flowData.account.descriptor,
        to: tokenContractAddress,
        data: allowanceCalldata.data,
    });

    if (!response.success) {
        throw new Error(response.error.message);
    }

    return decodeAllowance(response.payload.data, flowData.token.decimals);
};

export const openYieldApproveModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    spender,
    transactionId,
    preapprovedAmount,
    preapprovedAmountIsUnlimited,
    txType,
}: OpenYieldApproveModalParams) => {
    const contractAddress = getApprovalContractAddress({ flowType, flowData });

    if (!contractAddress) {
        setYieldGenericError({ dispatch, flowType, flowKey });

        return false;
    }

    dispatch(
        stablecoinYieldActions.openApprovalModal({
            flowType,
            flowKey,
            modalState: {
                amount,
                contractAddress,
                spender,
                preapprovedAmount,
                preapprovedAmountIsUnlimited,
                txType,
            },
            txHashTransactionId: transactionId ?? null,
        }),
    );

    return true;
};

export const openYieldRevokeModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    approveAmount,
    allowanceAmount,
    allowanceAmountIsUnlimited,
    transactions,
    fallbackSpender,
}: OpenYieldRevokeModalParams) => {
    const revokeModalParams = transactions ? getYieldRevokeModalParams(transactions) : null;
    const spender =
        revokeModalParams?.spender ??
        (transactions ? getYieldSpenderFromTransactions(transactions) : null) ??
        fallbackSpender;

    dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));

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
        preapprovedAmount: allowanceAmount || undefined,
        preapprovedAmountIsUnlimited: allowanceAmountIsUnlimited,
        txType: revokeModalParams ? 'revoke' : 'revoke-only',
    });
};

const openFallbackYieldRevokeModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    allowanceAmount,
    allowanceAmountIsUnlimited,
    fallbackSpender,
}: YieldSessionDataAmountPayload & {
    dispatch: Dispatch;
    allowanceAmount: string;
    allowanceAmountIsUnlimited: boolean;
    fallbackSpender?: string | null;
}) =>
    openYieldRevokeModal({
        dispatch,
        flowKey,
        flowType,
        flowData,
        approveAmount: amount,
        allowanceAmount,
        allowanceAmountIsUnlimited,
        transactions: null,
        fallbackSpender,
    });

export const submitYieldOpportunity = async ({
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

export const handleYieldApproveSuccessTxidThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    async (
        { flowType, flowKey, txid }: YieldSessionPayload & { txid: string },
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));

        try {
            if (approval.submitTxHashTransactionId) {
                await submitTransactionHash(
                    { transactionId: approval.submitTxHashTransactionId },
                    { hash: txid },
                );
            }

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: approveTxType,
                        txid,
                        amount: approval.modalState?.amount ?? '',
                    },
                }),
            );
            dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        }
    },
);

export const handleYieldApproveCancelThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }: YieldSessionPayload, { dispatch }) => {
        dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
        dispatch(stablecoinYieldActions.clearApprovalTransition({ flowType, flowKey }));
    },
);

export const initYieldAllowanceThunk = createThunk<void, InitYieldAllowancePayload, void>(
    `${YIELD_THUNK_PREFIX}/initAllowance`,
    async ({ flowKey, flowType, flowData }, { dispatch }) => {
        dispatch(stablecoinYieldActions.startInitializingAllowance({ flowType, flowKey }));

        try {
            const allowance = await getYieldAllowanceAmount({ flowData });
            const amount = new BigNumber(allowance.amount).gt(0) ? allowance.amount : '0';

            dispatch(
                stablecoinYieldActions.setInitializedAllowance({
                    flowType,
                    flowKey,
                    amount,
                    isUnlimited: allowance.isUnlimited,
                }),
            );

            if (amount !== '0') {
                dispatch(stablecoinYieldActions.skipApprovalStep({ flowType, flowKey }));
            }
        } catch {
            dispatch(stablecoinYieldActions.setAllowanceError({ flowType, flowKey }));
        } finally {
            dispatch(stablecoinYieldActions.finishInitializingAllowance({ flowType, flowKey }));
        }
    },
);

export const submitYieldRevokeThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const fallbackSpender = approval.approvedSpender ?? getAllowanceSpender(flowData);

        dispatch(stablecoinYieldActions.clearError({ flowType, flowKey }));

        try {
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: '0',
            });

            if (verification === 'failure') {
                openFallbackYieldRevokeModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount,
                    allowanceAmount: approval.allowanceAmount ?? '',
                    allowanceAmountIsUnlimited: approval.isAllowanceUnlimited,
                    fallbackSpender,
                });

                return;
            }

            const { transactions } = response.data;
            const spender =
                getYieldRevokeModalParams(transactions)?.spender ??
                getYieldSpenderFromTransactions(transactions) ??
                fallbackSpender;

            dispatch(
                stablecoinYieldActions.setApprovalResponse({
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
                allowanceAmount: approval.allowanceAmount ?? '',
                allowanceAmountIsUnlimited: approval.isAllowanceUnlimited,
                transactions,
                fallbackSpender: spender,
            });
        } catch {
            const isRevokeModalOpen = openFallbackYieldRevokeModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                amount,
                allowanceAmount: approval.allowanceAmount ?? '',
                allowanceAmountIsUnlimited: approval.isAllowanceUnlimited,
                fallbackSpender,
            });

            if (!isRevokeModalOpen) {
                setYieldGenericError({ dispatch, flowType, flowKey });
            }
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

        dispatch(stablecoinYieldActions.startSubmittingApproval({ flowType, flowKey }));

        try {
            if (flowType === 'withdraw') {
                dispatch(stablecoinYieldActions.cancelModification({ flowType, flowKey }));

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
            const spender =
                approvalModalParams?.spender ??
                revokeModalParams?.spender ??
                getYieldVaultAddressFromTransactions(transactions);

            dispatch(
                stablecoinYieldActions.setApprovalResponse({
                    flowType,
                    flowKey,
                    approvedSpender: spender,
                    revokeTransactions: transactions,
                }),
            );

            if (revokeModalParams) {
                dispatch(stablecoinYieldActions.setRevokeRequired({ flowType, flowKey }));
            }

            if (!approvalModalParams) {
                dispatch(
                    stablecoinYieldActions.completeApproval({
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
            dispatch(stablecoinYieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);
