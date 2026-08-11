import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldDepositReview } from '../hooks/useYieldDepositReview';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { type YieldReviewPreview } from '../utils/yieldReviewOutputUtils';

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
    const {
        depositStatus,
        handleDepositSubmitted,
        leaveReviewFromDeviceCancel,
        startDepositReview,
    } = useYieldDepositReview({
        flowData,
        flowKey,
        onReviewLeave: markReviewLeave,
    });
    const isDepositSigned = depositStatus === 'signed' || depositStatus === 'sending';
    const isSendingDeposit = depositStatus === 'sending';
    const activeStep = useYieldReviewActiveStep(flowData.account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isDepositSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: depositStatus === 'idle',
        startReview: startDepositReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldDepositReviewScreen.title"
            submitButton={
                isDepositSigned ? (
                    <Button isLoading={isSendingDeposit} onPress={handleDepositSubmitted}>
                        <Translation id="earn.yieldDepositReviewScreen.submitButton" />
                    </Button>
                ) : undefined
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={flowData.account.key}
                activeStep={activeStep}
                isSigned={isDepositSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
