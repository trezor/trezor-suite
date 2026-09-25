import {
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
} from '@suite-common/wallet-core';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { useYieldTransactionReviewOutputs } from '../../hooks/yield/useYieldTransactionReviewOutputs';
import { useYieldWithdrawReview } from '../../hooks/yield/useYieldWithdrawReview';
import {
    type YieldReviewPreview,
    getYieldReviewSummaryState,
    getYieldStatefulReviewOutputs,
} from '../../utils/yield/yieldReviewOutputUtils';

type YieldWithdrawReviewContentProps = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    flowType: YieldWithdrawFlowType;
    preview: YieldReviewPreview;
    reviewToken: YieldFlowDisplayToken;
};

export const YieldWithdrawReviewContent = ({
    flowData,
    flowKey,
    flowType,
    preview,
    reviewToken,
}: YieldWithdrawReviewContentProps) => {
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();

    const yieldTransactionReviewOutputs = useYieldTransactionReviewOutputs({
        evmTransactionPurpose: preview.evmTransactionPurpose,
        account: flowData.account,
    });

    const review = useYieldWithdrawReview({
        flowData,
        flowKey,
        flowType,
        onReviewLeave: markReviewLeave,
        reviewToken,
    });

    const isSigned = review.status === 'signed' || review.status === 'sending';
    const activeStep = useYieldReviewActiveStep(flowData.account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: review.status === 'idle',
        startReview: review.startReview,
    });

    const accountKey = flowData.account.key;

    const reviewOutputs = getYieldStatefulReviewOutputs({
        activeStep,
        isSigned,
        outputs: preview.outputs,
    });

    const summaryState = getYieldReviewSummaryState({
        activeStep,
        isSigned,
        outputsCount: preview.outputs.length,
    });

    const sheetController = { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet };

    const onSendTransaction = () => review.submitWithdraw();

    const onSendTransactionSuccess = (txid: string) => review.finalizeWithdrawSubmit(txid);

    return (
        <TransactionReviewScreen
            accountKey={accountKey}
            reviewOutputs={reviewOutputs}
            titleTranslationId="earn.yieldWithdrawReviewScreen.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId={
                flowType === 'redeem'
                    ? 'earn.yieldWithdrawReviewScreen.redeemSubmitButton'
                    : 'earn.yieldWithdrawReviewScreen.submitButton'
            }
            isTransactionAlreadySigned={isSigned}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            renderSummaryItem={({ onLayout }) => (
                <YieldTransactionReviewSummaryCard
                    accountKey={accountKey}
                    fee={preview.summary.fee}
                    onLayout={onLayout}
                    outputState={summaryState}
                />
            )}
            sheetController={sheetController}
            isManualSheetControlEnabled
            isBackInterceptorEnabled={false}
            closeActionType="back"
            outputTitleOverride={yieldTransactionReviewOutputs.getOutputTitle}
            outputOverride={yieldTransactionReviewOutputs.getOutputValue}
        />
    );
};
