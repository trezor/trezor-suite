import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    asAmountUnit,
    subunitsToUnits,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { fetchAllowance } from '../../allowance/fetchAllowance';
import { getWithdrawRequestAmount, getYieldVaultAddress } from '../utils/yieldUtils';
import { YIELD_PREFIX } from '../yieldConstants';
import { type YieldRootState, type YieldTranslationKey, yieldActions } from '../yieldReducer';
import { selectYieldSession } from '../yieldSelectors';
import type { YieldFlowResolvedData, YieldPositionFlowType } from '../yieldTypes';

const YIELD_THUNK_PREFIX = `${YIELD_PREFIX}/thunk`;
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

type SubmitYieldApprovePayload = YieldSessionDataAmountPayload & {
    flowType: 'deposit';
};

type InitYieldAllowancePayload = YieldSessionDataPayload & {
    flowType: 'deposit';
    shouldSkipApprovalStep?: boolean;
};

type SetYieldErrorParams = YieldSessionPayload & {
    dispatch: Dispatch;
    error?: YieldTranslationKey;
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
    txType: 'approve' | 'revoke';
};

type OpenYieldRevokeModalParams = YieldSessionDataPayload & {
    dispatch: Dispatch;
    approveAmount: string;
    allowanceAmount: string;
    spender: string | null;
};

export const setYieldError = ({
    dispatch,
    flowType,
    flowKey,
    error = YIELD_GENERIC_ERROR,
}: SetYieldErrorParams) => {
    dispatch(
        yieldActions.setError({
            flowType,
            flowKey,
            error,
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
        setYieldError({ dispatch, flowType, flowKey });

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
        setYieldError({ dispatch, flowType, flowKey });

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
        txType: 'revoke',
    });
};
type HandleYieldApproveSuccessTxidThunkParams = YieldSessionPayload & {
    fee?: string;
    isAmountUnlimited?: boolean;
    submittedAt?: number;
    txid: string;
};

type HandleYieldApproveSuccessTxidThunkState = YieldRootState;

export const handleYieldApproveSuccessTxidThunk = createThunk<
    void,
    HandleYieldApproveSuccessTxidThunkParams,
    { state: HandleYieldApproveSuccessTxidThunkState }
>(
    `${YIELD_THUNK_PREFIX}/handleApproveSuccessTxid`,
    ({ fee, flowType, flowKey, isAmountUnlimited, submittedAt, txid }, { dispatch, getState }) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);
        const approveTxType = approval.modalState?.txType ?? 'approve';

        dispatch(
            yieldActions.setPendingTx({
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
        dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
    },
);

export const handleYieldApproveCancelThunk = createThunk<void, YieldSessionPayload, void>(
    `${YIELD_THUNK_PREFIX}/handleApproveCancel`,
    ({ flowKey, flowType }, { dispatch }) => {
        dispatch(yieldActions.closeApprovalModal({ flowType, flowKey }));
    },
);

type InitYieldAllowanceThunkState = YieldRootState;

export const initYieldAllowanceThunk = createThunk<
    void,
    InitYieldAllowancePayload,
    { state: InitYieldAllowanceThunkState }
>(
    `${YIELD_THUNK_PREFIX}/initAllowance`,
    async (
        { flowKey, flowType, flowData, shouldSkipApprovalStep = true },
        { dispatch, getState },
    ) => {
        dispatch(yieldActions.startInitializingAllowance({ flowType, flowKey }));

        try {
            const spender = getYieldVaultAddress(flowData);
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
                yieldActions.setInitializedAllowance({
                    flowType,
                    flowKey,
                    amount,
                }),
            );

            if (shouldSkipApprovalStep) {
                const { action } = selectYieldSession(getState(), flowType, flowKey);
                const requestAmount = action.amount;
                const hasRequestAmount = !!requestAmount && new BigNumber(requestAmount).gt(0);

                // Only skip the approve step when the existing allowance already covers the
                // amount being deposited. For the wrapped-native flow `action.amount` holds
                // the just-wrapped amount, so a leftover dust allowance must NOT skip approval
                // (issue #30551). Without an entered amount (e.g. non-wrapped deposit, where the
                // approve step precedes amount entry) fall back to skipping on any allowance —
                // insufficiency is still caught later via the modify-approval path.
                const allowanceCoversRequest = hasRequestAmount
                    ? allowanceSubunits.gte(
                          unitsToSubunits({
                              value: asAmountUnit(new BigNumber(requestAmount)),
                              decimals: flowData.token.decimals,
                          }),
                      )
                    : amount !== '0';

                if (allowanceCoversRequest) {
                    dispatch(yieldActions.skipApprovalStep({ flowType, flowKey }));
                }
            }
        } catch (error) {
            dispatch(yieldActions.setAllowanceError({ flowType, flowKey }));
            throw error;
        }
    },
);

type SubmitYieldRevokeThunkState = YieldRootState;

export const submitYieldRevokeThunk = createThunk<
    void,
    YieldSessionDataAmountPayload,
    { state: SubmitYieldRevokeThunkState }
>(
    `${YIELD_THUNK_PREFIX}/submitRevoke`,
    ({ flowKey, flowType, flowData, amount }, { dispatch, getState }) => {
        const { approval } = selectYieldSession(getState(), flowType, flowKey);
        const spender = getYieldVaultAddress(flowData);

        dispatch(yieldActions.clearError({ flowType, flowKey }));
        dispatch(yieldActions.startSubmittingApproval({ flowType, flowKey }));

        openYieldRevokeModal({
            dispatch,
            flowKey,
            flowType,
            flowData,
            approveAmount: amount,
            allowanceAmount: approval.allowanceAmount ?? '',
            spender,
        });

        dispatch(yieldActions.finishSubmittingApproval({ flowType, flowKey }));
    },
);

export const submitYieldApproveThunk = createThunk<void, SubmitYieldApprovePayload, void>(
    `${YIELD_THUNK_PREFIX}/submitApprove`,
    async ({ flowKey, flowType, flowData, amount }, { dispatch }) => {
        const requestAmount = getApprovalRequestAmount({
            flowType,
            amount,
            flowData,
        });

        if (!requestAmount) {
            setYieldError({ dispatch, flowType, flowKey });

            return;
        }

        dispatch(yieldActions.startSubmittingApproval({ flowType, flowKey }));

        try {
            const spender = getYieldVaultAddress(flowData);
            const tokenContractAddress = flowData.token.contractAddress;

            if (!spender || !tokenContractAddress) {
                setYieldError({ dispatch, flowType, flowKey });

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
                    yieldActions.completeApproval({
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
                dispatch(yieldActions.setRevokeRequired({ flowType, flowKey }));

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
            setYieldError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(yieldActions.finishSubmittingApproval({ flowType, flowKey }));
        }
    },
);
