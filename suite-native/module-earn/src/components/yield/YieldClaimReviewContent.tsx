import { useCallback } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { YieldTransactionReviewOutputItem } from './YieldTransactionReviewOutputItem';
import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldClaimReview } from '../../hooks/yield/useYieldClaimReview';
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

type YieldClaimReviewContentProps = {
    account: Account;
    flowKey: string;
    preview: YieldReviewPreview;
};

export const YieldClaimReviewContent = ({
    account,
    flowKey,
    preview,
}: YieldClaimReviewContentProps) => {
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();

    const review = useYieldClaimReview({ account, flowKey, onReviewLeave: markReviewLeave });

    const isSigned = review.status === 'signed' || review.status === 'sending';
    const activeStep = useYieldReviewActiveStep(account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: review.status === 'idle',
        startReview: review.startReview,
    });

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

    const onSendTransaction = useCallback(() => review.submitClaim(), [review]);

    const onSendTransactionSuccess = useCallback(
        (txid: string) => {
            review.finalizeClaimSubmit(txid);
        },
        [review],
    );

    return (
        <TransactionReviewScreen
            accountKey={account.key}
            reviewOutputs={reviewOutputs}
            titleTranslationId="earn.yieldClaimReviewScreen.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId="earn.yieldClaimReviewScreen.submitButton"
            isTransactionAlreadySigned={isSigned}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            renderOutputItem={({ output, onLayout }) => (
                <YieldTransactionReviewOutputItem
                    accountKey={account.key}
                    evmTransactionPurpose={preview.evmTransactionPurpose}
                    onLayout={onLayout}
                    reviewOutput={output}
                />
            )}
            renderSummaryItem={({ onLayout }) => (
                <YieldTransactionReviewSummaryCard
                    accountKey={account.key}
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
