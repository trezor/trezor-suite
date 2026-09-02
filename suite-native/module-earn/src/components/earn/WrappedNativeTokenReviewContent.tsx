import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useWrappedNativeTokenReview } from '../../hooks/earn/useWrappedNativeTokenReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { type YieldBroadcastTransaction } from '../../types';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import { type YieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';
import { YieldReviewScreenLayout } from '../yield/YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from '../yield/YieldTransactionReviewOutputList';

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
    const { handleSubmitted, leaveReviewFromDeviceCancel, startReview, status } =
        useWrappedNativeTokenReview({
            account,
            flowContext,
            flowType,
            token: spentToken,
            amount,
            unsignedTransaction,
            onBroadcast,
            onReviewLeave: markReviewLeave,
        });
    const isSigned = status === 'signed' || status === 'sending';
    const activeStep = useYieldReviewActiveStep(account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: status === 'idle',
        startReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId={wrappedNativeFlowMessages[flowType].review.title}
            submitButton={
                isSigned && (
                    <Button isLoading={status === 'sending'} onPress={handleSubmitted}>
                        <Translation id={wrappedNativeFlowMessages[flowType].review.submitButton} />
                    </Button>
                )
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={account.key}
                activeStep={activeStep}
                isSigned={isSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
