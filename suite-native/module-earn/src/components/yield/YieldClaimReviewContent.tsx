import { type Account } from '@suite-common/wallet-types';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { useYieldClaimReview } from '../../hooks/yield/useYieldClaimReview';
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

    const yieldTransactionReviewOutputs = useYieldTransactionReviewOutputs({
        evmTransactionPurpose: preview.evmTransactionPurpose,
        account,
    });

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

    const onSendTransaction = () => review.submitClaim();

    const onSendTransactionSuccess = (txid: string) => {
        review.finalizeClaimSubmit(txid);
    };

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
            outputTitleOverride={yieldTransactionReviewOutputs.getOutputTitle}
            outputOverride={yieldTransactionReviewOutputs.getOutputValue}
        />
    );
};
