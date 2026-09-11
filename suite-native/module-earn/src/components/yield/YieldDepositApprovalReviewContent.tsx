import { useCallback, useMemo } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { type TransactionReviewSummaryOutput } from '@suite-common/wallet-types';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { useYieldApprovalReview } from '../../hooks/yield/useYieldApprovalReview';
import { useYieldApprovalReviewTransaction } from '../../hooks/yield/useYieldApprovalReviewTransaction';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import {
    type YieldAllowanceFormDraftTransactionType,
    type YieldApprovalLimitType,
} from '../../types';
import {
    buildYieldReviewPreview,
    getYieldReviewSummaryState,
    getYieldStatefulReviewOutputs,
} from '../../utils/yield/yieldReviewOutputUtils';

type YieldDepositApprovalReviewContentProps = {
    approvalLimitType?: YieldApprovalLimitType;
    device: TrezorDevice;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    transactionType: YieldAllowanceFormDraftTransactionType;
    vaultTokenName: string;
};

export const YieldDepositApprovalReviewContent = ({
    approvalLimitType,
    device,
    flowData,
    flowKey,
    transactionType,
    vaultTokenName,
}: YieldDepositApprovalReviewContentProps) => {
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();
    const reviewTransaction = useYieldApprovalReviewTransaction({
        accountKey: flowData.account.key,
    });
    const activeStep = useYieldReviewActiveStep(flowData.account.symbol);
    const isRevokeReview = transactionType === 'revoke';

    const submitButtonTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.submitButton'
        : 'earn.yieldDepositApprovalReviewScreen.submitButton';

    const titleTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.title'
        : 'earn.yieldDepositApprovalReviewScreen.title';

    const review = useYieldApprovalReview({
        approvalLimitType,
        flowData,
        flowKey,
        onReviewLeave: markReviewLeave,
        transactionType,
    });

    const preview = useMemo(() => {
        if (!reviewTransaction) {
            return null;
        }

        return buildYieldReviewPreview({
            account: flowData.account,
            device,
            formState: reviewTransaction.formState,
            precomposedTransaction: reviewTransaction.precomposedTransaction,
            type: transactionType,
            vaultName: vaultTokenName,
        });
    }, [device, flowData.account, reviewTransaction, transactionType, vaultTokenName]);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: review.isApprovalSigned,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: review.isApprovalReviewReady && !review.isSigningApproval,
        startReview: review.startApprovalReview,
    });

    const reviewOutputs = preview
        ? getYieldStatefulReviewOutputs({
              activeStep,
              isSigned: review.isApprovalSigned,
              outputs: preview.outputs,
          })
        : undefined;

    const summaryOutput: TransactionReviewSummaryOutput | undefined =
        preview && reviewTransaction
            ? {
                  state: getYieldReviewSummaryState({
                      activeStep,
                      isSigned: review.isApprovalSigned,
                      outputsCount: preview.outputs.length,
                  }),
                  totalSpent: reviewTransaction.precomposedTransaction.totalSpent,
                  fee: preview.summary.fee,
              }
            : undefined;

    const sheetController = { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet };

    const onSendTransaction = useCallback(() => review.submitApproval(), [review]);

    const onSendTransactionSuccess = useCallback(
        (txid: string) => {
            review.finalizeApprovalSubmit(txid);
        },
        [review],
    );

    return (
        <TransactionReviewScreen
            accountKey={flowData.account.key}
            reviewOutputs={reviewOutputs}
            summaryOutput={summaryOutput}
            flowType={transactionType}
            titleTranslationId={titleTranslationId}
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId={submitButtonTranslationId}
            isTransactionAlreadySigned={review.isApprovalSigned}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            sheetController={sheetController}
            isManualSheetControlEnabled
            isBackInterceptorEnabled={false}
            closeActionType="back"
        />
    );
};
