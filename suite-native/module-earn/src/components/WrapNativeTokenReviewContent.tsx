import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { EarnReviewSubmittedCard } from './EarnReviewSubmittedCard';
import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useWrapNativeTokenReview } from '../hooks/useWrapNativeTokenReview';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { type YieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type WrapNativeTokenReviewContentProps = {
    account: Account;
    amount: string;
    nativeToken: YieldFlowDisplayToken;
    preview: YieldReviewPreview;
    unsignedTransaction: string;
};

export const WrapNativeTokenReviewContent = ({
    account,
    amount,
    nativeToken,
    preview,
    unsignedTransaction,
}: WrapNativeTokenReviewContentProps) => {
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();
    const { handleWrapSubmitted, leaveReviewFromDeviceCancel, startWrapReview, wrapStatus } =
        useWrapNativeTokenReview({
            account,
            token: nativeToken,
            amount,
            unsignedTransaction,
            onReviewLeave: markReviewLeave,
        });
    const isWrapSigned = wrapStatus === 'signed' || wrapStatus === 'sending';
    const activeStep = useYieldReviewActiveStep(account.symbol);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isWrapSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: wrapStatus === 'idle',
        startReview: startWrapReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.wrapNativeToken.review.title"
            submittedCard={
                isWrapSigned ? (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.wrapNativeToken.review.submitButton"
                        isButtonLoading={wrapStatus === 'sending'}
                        onButtonPress={handleWrapSubmitted}
                    />
                ) : undefined
            }
        >
            <YieldTransactionReviewOutputList
                accountKey={account.key}
                activeStep={activeStep}
                isSigned={isWrapSigned}
                preview={preview}
            />
        </YieldReviewScreenLayout>
    );
};
