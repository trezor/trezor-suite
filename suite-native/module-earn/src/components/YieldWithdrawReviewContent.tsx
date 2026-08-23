import {
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
} from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { useYieldWithdrawReview } from '../hooks/useYieldWithdrawReview';
import { type YieldReviewPreview } from '../utils/yieldReviewOutputUtils';

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

    const review = useYieldWithdrawReview({
        flowData,
        flowKey,
        flowType,
        onReviewLeave: markReviewLeave,
        reviewToken,
    });

    const isSigned = review.status === 'signed' || review.status === 'sending';
    const isSending = review.status === 'sending';
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

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldWithdrawReviewScreen.title"
            submitButton={
                isSigned && (
                    <Button isLoading={isSending} onPress={review.submit}>
                        <Translation
                            id={
                                flowType === 'redeem'
                                    ? 'earn.yieldWithdrawReviewScreen.redeemSubmitButton'
                                    : 'earn.yieldWithdrawReviewScreen.submitButton'
                            }
                        />
                    </Button>
                )
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={flowData.account.key}
                activeStep={activeStep}
                isSigned={isSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
