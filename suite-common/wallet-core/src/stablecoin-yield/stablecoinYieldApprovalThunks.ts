import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    asAmountUnit,
    subunitsToUnits,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { STABLECOIN_YIELD_PREFIX, stablecoinYieldActions } from './stablecoinYieldReducer';
import { selectStablecoinYieldSession } from './stablecoinYieldSelectors';
import type { YieldFlowResolvedData, YieldPositionFlowType } from './stablecoinYieldTypes';
import { getAllowanceSpender, getWithdrawRequestAmount } from './stablecoinYieldUtils';
import { fetchAllowance } from '../allowance/fetchAllowance';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;
const YIELD_GENERIC_ERROR = 'TR_EARN_YIELD_ERROR_GENERIC';

export type YieldSessionPayload = {
    flowType: YieldPositionFlowType;
    flowKey: string;
};

export type YieldSessionDataPayload = YieldSessionPayload & {
    flowData: YieldFlowResolvedData;
};

export type YieldSessionDataAmountPayload = YieldSessionDataPayload & {
    amount: string;
};

type InitYieldAllowancePayload = YieldSessionDataPayload & {
    flowType: 'deposit';
    shouldSkipApprovalStep?: boolean;
};

type SetYieldGenericErrorParams = YieldSessionPayload & {
    dispatch: Dispatch;
};

type GetApprovalContractAddressParams = {
    flowType: YieldPositionFlowType;
    flowData: YieldFlowResolvedData;
};

type GetApprovalRequestAmountParams = GetApprovalContractAddressParams & {
    amount: string;
};

type OpenYieldApproveModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    amount: string;
    spender: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
};

type OpenYieldRevokeModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    approveAmount: string;
    allowanceAmount: string;
    spender: string | null;
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
    flowType === 'deposit'
        ? (flowData.token.contractAddress ?? undefined)
        : (flowData.receiptToken.contractAddress ?? undefined);

export const getApprovalRequestAmount = ({
    flowType,
    amount,
    flowData,
}: GetApprovalRequestAmountParams) => {
    if (flowType === 'deposit') {
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

export const openYieldApproveModal = ({
    dispatch,
    flowKey,
    flowType,
    flowData,
    amount,
    spender,
    preapprovedAmount,
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
                txType,
            },
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
    spender,
}: OpenYieldRevokeModalParams) => {
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
        preapprovedAmount: allowanceAmount || undefined,
        txType: 'revoke-only',
    });
};

export const handleYieldApproveSuccessTxidThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    (
        {
            fee,
            flowType,
            flowKey,
            isAmountUnlimited,
            submittedAt,
            txid,
        }: YieldSessionPayload & {
            fee?: string;
            isAmountUnlimited?: boolean;
            submittedAt?: number;
            txid: string;
        },
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(
            stablecoinYieldActions.setPendingTx({
                flowType,
                flowKey,
                tx: {
                    type: approveTxType,
                    txid,
                    amount: approval.modalState?.amount ?? '',
                    fee,
                    submittedAt,
                    isAmountUnlimited,
                },
            }),
        );
        dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
    },
);

export const handleYieldApproveCancelThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }: YieldSessionPayload, { dispatch }) => {
        dispatch(stablecoinYieldActions.closeApprovalModal({ flowType, flowKey }));
    },
);

export const initYieldAllowanceThunk = createThunk<void, InitYieldAllowancePayload, void>(
    `${YIELD_THUNK_PREFIX}/initAllowance`,
    async ({ flowKey, flowType, flowData, shouldSkipApprovalStep = true }, { dispatch }) => {
        dispatch(stablecoinYieldActions.startInitializingAllowance({ flowType, flowKey }));

        try {
            const spender = getAllowanceSpender(flowData);
            const tokenContractAddress = flowData.token.contractAddress;

            if (!spender || !tokenContractAddress) {
                throw new Error(
                    'Yield allowance cannot be initialized without spender and token contract.',
                );
            }

            const allowanceSubunits = await fetchAllowance({
                owner: flowData.account.descriptor,
                spender,
                tokenContractAddress,
                coin: flowData.account.symbol,
            });
            const fetchedAmount = subunitsToUnits({
                value: allowanceSubunits,
                decimals: flowData.token.decimals,
            });
            const amount = fetchedAmount.gt(0) ? fetchedAmount.toString() : '0';

            dispatch(
                stablecoinYieldActions.setInitializedAllowance({
                    flowType,
                    flowKey,
                    amount,
                }),
            );

            if (shouldSkipApprovalStep && amount !== '0') {
                dispatch(stablecoinYieldActions.skipApprovalStep({ flowType, flowKey }));
            }
        } catch (error) {
            dispatch(stablecoinYieldActions.setAllowanceError({ flowType, flowKey }));
            throw error;
        } finally {
            dispatch(stablecoinYieldActions.finishInitializingAllowance({ flowType, flowKey }));
        }
    },
);

export const submitYieldRevokeThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const { approval } = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const spender = getAllowanceSpender(flowData);

        dispatch(stablecoinYieldActions.clearError({ flowType, flowKey }));
        dispatch(stablecoinYieldActions.startSubmittingApproval({ flowType, flowKey }));

        openYieldRevokeModal({
            dispatch,
            flowKey,
            flowType,
            flowData,
            approveAmount: amount,
            allowanceAmount: approval.allowanceAmount ?? '',
            spender,
        });

        dispatch(stablecoinYieldActions.finishSubmittingApproval({ flowType, flowKey }));
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

            const spender = getAllowanceSpender(flowData);
            const tokenContractAddress = flowData.token.contractAddress;

            if (!spender || !tokenContractAddress) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const allowanceSubunits = await fetchAllowance({
                owner: flowData.account.descriptor,
                spender,
                tokenContractAddress,
                coin: flowData.account.symbol,
            });
            const requestSubunits = unitsToSubunits({
                value: asAmountUnit(new BigNumber(requestAmount)),
                decimals: flowData.token.decimals,
            });

            if (allowanceSubunits.gte(requestSubunits)) {
                dispatch(
                    stablecoinYieldActions.completeApproval({
                        flowType,
                        flowKey,
                        amount,
                    }),
                );

                return;
            }

            if (
                allowanceSubunits.gt(0) &&
                !tokenSupportsIncreasingAllowance(tokenContractAddress)
            ) {
                dispatch(stablecoinYieldActions.setRevokeRequired({ flowType, flowKey }));

                return;
            }

            openYieldApproveModal({
                dispatch,
                flowKey,
                flowType,
                flowData,
                amount: requestAmount,
                spender,
                txType: 'approve',
            });
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);
