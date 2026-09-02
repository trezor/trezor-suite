import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldDepositReview } from '../../hooks/yield/useYieldDepositReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { type YieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

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
            titleTranslationId="earn.yieldDepositReviewScreen.title"
            submitButton={
                isSigned && (
                    <Button isLoading={isSending} onPress={review.submit}>
                        <Translation id="earn.yieldDepositReviewScreen.submitButton" />
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
