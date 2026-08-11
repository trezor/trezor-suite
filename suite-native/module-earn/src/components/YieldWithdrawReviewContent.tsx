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
    const {
        withdrawStatus,
        handleWithdrawSubmitted,
        leaveReviewFromDeviceCancel,
        startWithdrawReview,
    } = useYieldWithdrawReview({
        flowData,
        flowKey,
        flowType,
        onReviewLeave: markReviewLeave,
        reviewToken,
    });
    const isWithdrawSigned = withdrawStatus === 'signed' || withdrawStatus === 'sending';
    const isSendingWithdraw = withdrawStatus === 'sending';
    const activeStep = useYieldReviewActiveStep(flowData.account.symbol);
    const submitButtonTranslationId =
        flowType === 'redeem'
            ? 'earn.yieldWithdrawReviewScreen.redeemSubmitButton'
            : 'earn.yieldWithdrawReviewScreen.submitButton';

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isWithdrawSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: withdrawStatus === 'idle',
        startReview: startWithdrawReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldWithdrawReviewScreen.title"
            submitButton={
                isWithdrawSigned ? (
                    <Button isLoading={isSendingWithdraw} onPress={handleWithdrawSubmitted}>
                        <Translation id={submitButtonTranslationId} />
                    </Button>
                ) : undefined
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={flowData.account.key}
                activeStep={activeStep}
                isSigned={isWithdrawSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
