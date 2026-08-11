import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useWrappedNativeTokenReview } from '../hooks/useWrappedNativeTokenReview';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { type YieldBroadcastTransaction } from '../types';
import { type YieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type WrappedNativeTokenReviewContentProps = {
    account: Account;
    amount: string;
    flowType: WrappedNativeFlowType;
    onBroadcast?: (broadcast: YieldBroadcastTransaction) => void;
    preview: YieldReviewPreview;
    spentToken: YieldFlowDisplayToken;
    unsignedTransaction: string;
};

const flowMessages = {
    wrap: {
        submitButton: 'earn.wrapNativeToken.review.submitButton',
        title: 'earn.wrapNativeToken.review.title',
    },
    unwrap: {
        submitButton: 'earn.unwrapNativeToken.review.submitButton',
        title: 'earn.unwrapNativeToken.review.title',
    },
} satisfies Record<WrappedNativeFlowType, { submitButton: TxKeyPath; title: TxKeyPath }>;

export const WrappedNativeTokenReviewContent = ({
    account,
    amount,
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
            titleTranslationId={flowMessages[flowType].title}
            submitButton={
                isSigned && (
                    <Button isLoading={status === 'sending'} onPress={handleSubmitted}>
                        <Translation id={flowMessages[flowType].submitButton} />
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
