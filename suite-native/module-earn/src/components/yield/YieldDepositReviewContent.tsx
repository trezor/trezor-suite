import { useCallback } from 'react';

import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { YieldTransactionReviewOutputItem } from './YieldTransactionReviewOutputItem';
import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldDepositReview } from '../../hooks/yield/useYieldDepositReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import {
    type YieldReviewPreview,
    getYieldReviewSummaryState,
    getYieldStatefulReviewOutputs,
} from '../../utils/yield/yieldReviewOutputUtils';

type YieldDepositReviewContentProps = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    preview: YieldReviewPreview;
};

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

    const onSendTransaction = useCallback(() => review.submitDeposit(), [review]);

    const onSendTransactionSuccess = useCallback(
        (txid: string) => {
            review.finalizeDepositSubmit(txid);
        },
        [review],
    );

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
            renderOutputItem={({ output, onLayout }) => (
                <YieldTransactionReviewOutputItem
                    accountKey={accountKey}
                    evmTransactionPurpose={preview.evmTransactionPurpose}
                    onLayout={onLayout}
                    reviewOutput={output}
                />
            )}
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
        />
    );
};
