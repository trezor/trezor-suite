import { type Account } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldClaimReview } from '../../hooks/yield/useYieldClaimReview';
import { useYieldReviewActiveStep } from '../../hooks/yield/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../../hooks/yield/useYieldReviewScreenControls';
import { type YieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

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
    const isSending = review.status === 'sending';
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

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldClaimReviewScreen.title"
            submitButton={
                isSigned && (
                    <Button isLoading={isSending} onPress={review.submit}>
                        <Translation id="earn.yieldClaimReviewScreen.submitButton" />
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
