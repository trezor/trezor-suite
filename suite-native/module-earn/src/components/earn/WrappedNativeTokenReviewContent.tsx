import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { useWrappedNativeTokenReview } from '../../hooks/earn/useWrappedNativeTokenReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { useYieldTransactionReviewOutputs } from '../../hooks/yield/useYieldTransactionReviewOutputs';
import { type YieldBroadcastTransaction } from '../../types';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import {
    type YieldReviewPreview,
    getYieldReviewSummaryState,
    getYieldStatefulReviewOutputs,
} from '../../utils/yield/yieldReviewOutputUtils';
import { YieldTransactionReviewSummaryCard } from '../yield/YieldTransactionReviewSummaryCard';

type WrappedNativeTokenReviewContentProps = {
    account: Account;
    amount: string;
    flowContext: 'standalone' | 'in-flow';
    flowType: WrappedNativeFlowType;
    onBroadcast?: (broadcast: YieldBroadcastTransaction) => void;
    preview: YieldReviewPreview;
    spentToken: YieldFlowDisplayToken;
    unsignedTransaction: string;
};

export const WrappedNativeTokenReviewContent = ({
    account,
    amount,
    flowContext,
    flowType,
    onBroadcast,
    preview,
    spentToken,
    unsignedTransaction,
}: WrappedNativeTokenReviewContentProps) => {
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

    const review = useWrappedNativeTokenReview({
        account,
        flowContext,
        flowType,
        token: spentToken,
        amount,
        unsignedTransaction,
        onBroadcast,
        onReviewLeave: markReviewLeave,
    });

    const isSigned = review.status === 'signed' || review.status === 'sending';
    const activeStep = useYieldReviewActiveStep(account.symbol);

    const titleTranslationId = wrappedNativeFlowMessages[flowType].review.title;
    const sendButtonTranslationId = wrappedNativeFlowMessages[flowType].review.submitButton;

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

    const onSendTransaction = () => review.submitWrappedNativeToken();

    const onSendTransactionSuccess = (txid: string) => {
        review.finalizeWrappedNativeTokenSubmit(txid);
    };

    return (
        <TransactionReviewScreen
            accountKey={account.key}
            reviewOutputs={reviewOutputs}
            titleTranslationId={titleTranslationId}
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId={sendButtonTranslationId}
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
