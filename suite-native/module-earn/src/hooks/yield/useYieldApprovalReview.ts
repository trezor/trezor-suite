import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { StackActions, useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    type YieldFlowResolvedData,
    type YieldRootState,
    formDraftActions,
    handleYieldApproveSuccessTxidThunk,
    pushSendFormTransactionThunk,
    selectIsMevProtectionEnabled,
    selectYieldSession,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';

import { useYieldApprovalReviewNavigation } from './useYieldApprovalReviewNavigation';
import { useYieldApprovalReviewTransaction } from './useYieldApprovalReviewTransaction';
import { getYieldAllowanceFormDraftKey } from '../../thunks/yield/yieldApprovalThunks';
import {
    type YieldAllowanceFormDraftTransactionType,
    type YieldApprovalLimitType,
    type YieldReviewSigningResult,
} from '../../types';
import { isUserCancelledSignError } from '../../utils/earn/utils';
import { getYieldApprovalAnalyticsType } from '../../utils/yield/yieldAnalyticsUtils';
import { useHandleEarnReviewError } from '../earn/useHandleEarnReviewError';

type UseYieldApprovalReviewParams = {
    approvalLimitType?: YieldApprovalLimitType;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    onReviewLeave?: () => void;
    transactionType: YieldAllowanceFormDraftTransactionType;
};

type UseYieldApprovalReviewResult = {
    finalizeApprovalSubmit: (txid: string) => Promise<void>;
    isApprovalSigned: boolean;
    isApprovalReviewReady: boolean;
    isSigningApproval: boolean;
    leaveReviewFromDeviceCancel: () => void;
    startApprovalReview: () => Promise<YieldReviewSigningResult>;
    submitApproval: () => Promise<string | undefined>;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApprovalReview | YieldStackRoutes.YieldDepositRevokeReview,
    RootStackParamList
>;

export const useYieldApprovalReview = ({
    approvalLimitType,
    flowData,
    flowKey,
    onReviewLeave,
    transactionType,
}: UseYieldApprovalReviewParams): UseYieldApprovalReviewResult => {
    const navigation = useNavigation<NavigationProps>();
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const reviewAlertType = transactionType === 'revoke' ? 'yield-revoke' : 'yield-approval';
    const handleReviewError = useHandleEarnReviewError(reviewAlertType, navigation);
    const reportApprovalReviewEvent = useCallback(
        (payload: { action: 'continue' | 'cancel' } | { errorMessage: string }) => {
            const networkSymbol = flowData.account.symbol;
            const vaultId = flowData.vault.id;

            if ('errorMessage' in payload) {
                analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        networkSymbol,
                        vaultId,
                        action: 'continue',
                        type: 'error',
                        ...payload,
                    },
                });
            } else {
                analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        networkSymbol,
                        vaultId,
                        type: transactionType === 'revoke' ? 'revoke-modal' : 'approve-modal',
                        approvalType: getYieldApprovalAnalyticsType(approvalLimitType),
                        ...payload,
                    },
                });
            }
        },
        [analytics, approvalLimitType, flowData.account.symbol, flowData.vault.id, transactionType],
    );
    const formDraftKey = useMemo(
        () => getYieldAllowanceFormDraftKey(flowKey, transactionType),
        [flowKey, transactionType],
    );
    const [isSigningApproval, setIsSigningApproval] = useState(false);
    const [isSendingApproval, setIsSendingApproval] = useState(false);

    const isApprovalSigned = useSelector(selectIsTransactionAlreadySigned);
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const session = useSelector((state: YieldRootState) =>
        selectYieldSession(state, 'deposit', flowKey),
    );
    const { approval } = session;

    const reviewTransaction = useYieldApprovalReviewTransaction({
        accountKey: flowData.account.key,
    });

    const isPreparingApproval = approval.isSubmitting || !reviewTransaction;
    const isApprovalReviewReady = !isPreparingApproval && !isApprovalSigned;
    const shouldConfirmApprovalCancellation =
        isSigningApproval || isApprovalSigned || isSendingApproval;

    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess, wasReviewCancelledByUser } =
        useYieldApprovalReviewNavigation({
            flowKey,
            onReviewLeave,
            shouldConfirmCancellation: shouldConfirmApprovalCancellation,
            transactionType,
        });

    const startApprovalReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (isApprovalSigned) {
            return 'signed';
        }

        if (isSigningApproval) {
            return 'already-running';
        }

        if (!reviewTransaction) {
            return 'not-ready';
        }

        const { formState, precomposedTransaction } = reviewTransaction;

        reportApprovalReviewEvent({ action: 'continue' });
        setIsSigningApproval(true);

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount: flowData.account,
                }),
            ),
        );

        if (!deviceAccessResponse.success) {
            setIsSigningApproval(false);
            reportApprovalReviewEvent({ errorMessage: 'submit-failed' });
            handleReviewError({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });

            return 'failed';
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            setIsSigningApproval(false);

            if (
                isUserCancelledSignError(signTransactionResponse.payload) ||
                wasReviewCancelledByUser()
            ) {
                reportApprovalReviewEvent({ action: 'cancel' });

                return 'cancelled';
            }

            reportApprovalReviewEvent({ errorMessage: 'submit-failed' });
            handleReviewError(signTransactionResponse.payload);

            return 'failed';
        }

        setIsSigningApproval(false);

        return 'signed';
    }, [
        dispatch,
        flowData.account,
        handleReviewError,
        isApprovalSigned,
        isSigningApproval,
        reportApprovalReviewEvent,
        reviewTransaction,
        wasReviewCancelledByUser,
    ]);

    const submitApproval = useCallback(async (): Promise<string | undefined> => {
        if (!isApprovalSigned || isSendingApproval) {
            return undefined;
        }

        setIsSendingApproval(true);

        const pushResponse = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount: flowData.account,
                isMevProtectionEnabled: isMevProtectionEnabled && isMevProtectionFeatureEnabled,
            }),
        );

        if (isRejected(pushResponse)) {
            setIsSendingApproval(false);
            reportApprovalReviewEvent({ errorMessage: 'push-failed' });
            handleReviewError(pushResponse.payload);

            return undefined;
        }

        return pushResponse.payload.payload.txid;
    }, [
        dispatch,
        flowData.account,
        handleReviewError,
        isApprovalSigned,
        isMevProtectionEnabled,
        isMevProtectionFeatureEnabled,
        isSendingApproval,
        reportApprovalReviewEvent,
    ]);

    // Fired when the pushed transaction appears in the transactions store; the
    // store keeps returning it afterwards, so guard against repeated finalization
    // (pop(1) dispatched twice would leave the whole flow).
    const hasFinalizedSubmitRef = useRef(false);

    const finalizeApprovalSubmit = useCallback(
        async (txid: string) => {
            if (hasFinalizedSubmitRef.current) {
                return;
            }

            hasFinalizedSubmitRef.current = true;

            await dispatch(
                handleYieldApproveSuccessTxidThunk({
                    flowType: 'deposit',
                    flowKey,
                    txid,
                    fee: reviewTransaction?.precomposedTransaction.fee,
                    submittedAt: Date.now(),
                    isAmountUnlimited:
                        transactionType === 'approve' && approvalLimitType === 'unlimited',
                }),
            );
            dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
            dispatch(sendFormActions.discardTransaction());
            setIsSendingApproval(false);
            markReviewNavigationSuccess();
            navigation.dispatch(StackActions.pop(1));
        },
        [
            approvalLimitType,
            dispatch,
            flowKey,
            formDraftKey,
            markReviewNavigationSuccess,
            navigation,
            reviewTransaction?.precomposedTransaction.fee,
            transactionType,
        ],
    );

    return {
        finalizeApprovalSubmit,
        isApprovalSigned,
        isApprovalReviewReady,
        isSigningApproval,
        leaveReviewFromDeviceCancel,
        startApprovalReview,
        submitApproval,
    };
};
