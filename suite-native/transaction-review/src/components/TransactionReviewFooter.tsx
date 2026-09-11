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

export const TransactionReviewFooter = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const insets = useBannerAwareSafeAreaInsets();

    const review = useTransactionReview();

    // The success callback navigates away and dispatches cleanup; the pending
    // transaction stays in the store, so guard against firing it again on
    // subsequent renders.
    const hasHandledSuccessRef = useRef(false);
    const { transaction, onSendTransactionSuccess } = review;

    useEffect(() => {
        if (!transaction || hasHandledSuccessRef.current) return;

        hasHandledSuccessRef.current = true;
        onSendTransactionSuccess?.(transaction.txid);
    }, [transaction, onSendTransactionSuccess]);

    const onSendTransaction = async () => {
        if (!review.account) return;
        if (review.isSendButtonDisabled) return;

        review.setIsSending(true);

        if (review.onSendTransaction) {
            const txid = await review.onSendTransaction();

            if (txid) {
                review.setTxid(txid);

                return;
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
                    isDisabled={review.isSendButtonDisabled}
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
