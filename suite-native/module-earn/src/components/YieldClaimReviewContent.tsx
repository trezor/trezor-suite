import { type Account } from '@suite-common/wallet-types';

import { EarnReviewSubmittedCard } from './EarnReviewSubmittedCard';
import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldClaimReview } from '../hooks/useYieldClaimReview';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { type YieldReviewPreview } from '../utils/yieldReviewOutputUtils';

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
    const { claimStatus, handleClaimSubmitted, leaveReviewFromDeviceCancel, startClaimReview } =
        useYieldClaimReview({
            account,
            flowKey,
            onReviewLeave: markReviewLeave,
        });
    const isClaimSigned = claimStatus === 'signed' || claimStatus === 'sending';
    const isSendingClaim = claimStatus === 'sending';
    const activeStep = useYieldReviewActiveStep(account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isClaimSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: claimStatus === 'idle',
        startReview: startClaimReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldClaimReviewScreen.title"
            submittedCard={
                isClaimSigned ? (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.yieldClaimReviewScreen.submitButton"
                        isButtonLoading={isSendingClaim}
                        messageTranslationId="earn.yieldClaimReviewScreen.successMessage"
                        onButtonPress={handleClaimSubmitted}
                    />
                ) : undefined
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={account.key}
                activeStep={activeStep}
                isSigned={isClaimSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
