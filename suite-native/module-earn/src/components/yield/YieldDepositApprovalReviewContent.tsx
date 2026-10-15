import { useMemo } from 'react';

import { injectGetCalldata } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { TransactionReviewScreen } from '@suite-native/transaction-review';
import { useServices } from '@trezor/dependency-injection';

import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldApprovalReview } from '../../hooks/yield/useYieldApprovalReview';
import { useYieldApprovalReviewTransaction } from '../../hooks/yield/useYieldApprovalReviewTransaction';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { useYieldTransactionReviewOutputs } from '../../hooks/yield/useYieldTransactionReviewOutputs';
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
    vaultName: string;
};

export const YieldDepositApprovalReviewContent = ({
    approvalLimitType,
    device,
    flowData,
    flowKey,
    transactionType,
    vaultName,
}: YieldDepositApprovalReviewContentProps) => {
    const { getCalldata } = useServices(injectGetCalldata);

    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();

    const yieldTransactionReviewOutputs = useYieldTransactionReviewOutputs({
        evmTransactionPurpose: transactionType,
        account: flowData.account,
    });

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

        return buildYieldReviewPreview(getCalldata(flowData.account.symbol), {
            account: flowData.account,
            device,
            formState: reviewTransaction.formState,
            precomposedTransaction: reviewTransaction.precomposedTransaction,
            type: transactionType,
            vaultName,
        });
    }, [
        device,
        flowData.account,
        reviewTransaction,
        transactionType,
        vaultName,
        getCalldata,
        flowData,
    ]);

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

    const summaryState = preview
        ? getYieldReviewSummaryState({
              activeStep,
              isSigned: review.isApprovalSigned,
              outputsCount: preview.outputs.length,
          })
        : undefined;

    const sheetController = { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet };

    const onSendTransaction = () => review.submitApproval();

    const onSendTransactionSuccess = (txid: string) => {
        review.finalizeApprovalSubmit(txid);
    };

    return (
        <TransactionReviewScreen
            accountKey={flowData.account.key}
            reviewOutputs={reviewOutputs}
            titleTranslationId={titleTranslationId}
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId={submitButtonTranslationId}
            isTransactionAlreadySigned={review.isApprovalSigned}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            renderSummaryItem={({ onLayout }) =>
                !!preview && (
                    <YieldTransactionReviewSummaryCard
                        accountKey={flowData.account.key}
                        fee={preview.summary.fee}
                        onLayout={onLayout}
                        outputState={summaryState}
                    />
                )
            }
            sheetController={sheetController}
            isManualSheetControlEnabled
            isBackInterceptorEnabled={false}
            closeActionType="back"
            outputTitleOverride={yieldTransactionReviewOutputs.getOutputTitle}
            outputOverride={yieldTransactionReviewOutputs.getOutputValue}
        />
    );
};
