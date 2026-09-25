import { useEffect, useRef } from 'react';
import { SlideInDown } from 'react-native-reanimated';

import { AnimatedBox, Button, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useTransactionReview } from '../hooks/useTransactionReview';

const containerStyle = prepareNativeStyle<{ bottomInset: number }>((_, { bottomInset }) => ({
    paddingBottom: bottomInset,
}));

interface TransactionReviewFooterProps {
    isSendButtonDisabled?: boolean;
}

export const TransactionReviewFooter = ({ isSendButtonDisabled }: TransactionReviewFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const insets = useBannerAwareSafeAreaInsets();

    const review = useTransactionReview();

    // The success callback navigates away and dispatches cleanup; the pending
    // transaction stays in the store, so guard against firing it again on
    // subsequent renders.
    const hasHandledSuccessRef = useRef(false);
    const { transaction, onSendTransactionConfirmed } = review;

    useEffect(() => {
        if (!transaction || hasHandledSuccessRef.current) return;

        hasHandledSuccessRef.current = true;
        onSendTransactionConfirmed?.(transaction.txid);
    }, [transaction, onSendTransactionConfirmed]);

    const isSendDisabled = isSendButtonDisabled ?? review.isSendButtonDisabled;

    const onSendTransaction = async () => {
        if (!review.account) return;
        if (isSendDisabled) return;

        review.setIsSending(true);

        if (review.onSendTransaction) {
            try {
                const txid = await review.onSendTransaction();

                if (txid) {
                    review.setTxid(txid);
                    review.onSendTransactionSuccess?.(txid);

                    return;
                }
            } catch {
                review.setIsSending(false);
            }
        }

        review.setIsSending(false);
    };

    return (
        <AnimatedBox
            entering={SlideInDown}
            style={applyStyle(containerStyle, { bottomInset: insets.bottom })}
            testID={review.footerTestId}
        >
            <ScrollToEndOnMount>
                <Button
                    isLoading={review.isSendButtonLoading ?? review.isSending}
                    isDisabled={isSendDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.validateForm')}
                    testID={review.sendButtonTestId}
                    onPress={onSendTransaction}
                >
                    <Translation id={review.sendButtonTranslationId} />
                </Button>
            </ScrollToEndOnMount>
        </AnimatedBox>
    );
};
