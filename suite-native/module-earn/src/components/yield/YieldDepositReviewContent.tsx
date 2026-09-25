import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldDepositReview } from '../../hooks/yield/useYieldDepositReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { useYieldTransactionReviewOutputs } from '../../hooks/yield/useYieldTransactionReviewOutputs';
import {
    type YieldReviewPreview,
    getYieldReviewSummaryState,
    getYieldStatefulReviewOutputs,
} from '../../utils/yield/yieldReviewOutputUtils';

interface YieldDepositReviewContentProps {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    preview: YieldReviewPreview;
}

export const YieldDepositReviewContent = ({
    flowData,
    flowKey,
    preview,
}: YieldDepositReviewContentProps) => {
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

    const review = useYieldDepositReview({ flowData, flowKey, onReviewLeave: markReviewLeave });

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

    const onSendTransaction = () => review.submitDeposit();

    const onSendTransactionSuccess = (txid: string) => {
        review.finalizeDepositSubmit(txid);
    };

    return (
        <TransactionReviewScreen
            accountKey={accountKey}
            reviewOutputs={reviewOutputs}
            titleTranslationId="earn.yieldDepositReviewScreen.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId="earn.yieldDepositReviewScreen.submitButton"
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
