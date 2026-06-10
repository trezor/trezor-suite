import { type StablecoinYieldActionReviewState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';

import { EarnReviewSubmittedCard } from './EarnReviewSubmittedCard';
import { YieldReviewList } from './YieldReviewList';
import { buildYieldClaimReviewCards } from './YieldReviewListPresets';
import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { useYieldClaimReview } from '../hooks/useYieldClaimReview';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';

type ClaimReview = Extract<StablecoinYieldActionReviewState, { type: 'claim' }>;

type YieldClaimReviewContentProps = {
    account: Account;
    fee: string;
    flowKey: string;
    review: ClaimReview;
};

export const YieldClaimReviewContent = ({
    account,
    fee,
    flowKey,
    review,
}: YieldClaimReviewContentProps) => {
    const { translate } = useTranslate();
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
            <YieldReviewList
                cards={buildYieldClaimReviewCards(
                    {
                        accountKey: account.key,
                        fee,
                        rewards: review.rewards,
                    },
                    translate,
                )}
                isSigned={isClaimSigned}
                networkSymbol={account.symbol}
            />
        </YieldReviewScreenLayout>
    );
};
