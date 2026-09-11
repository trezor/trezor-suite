import { AnimatedBox, Button, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { useEffect } from 'react';
import { SlideInDown } from 'react-native-reanimated';
import { useTransactionReview } from '../hooks/useTransactionReview';

const containerStyle = prepareNativeStyle<{ bottomInset: number }>((_, { bottomInset }) => ({
    paddingBottom: bottomInset,
}));

export const TransactionReviewFooter = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const insets = useBannerAwareSafeAreaInsets();

    const review = useTransactionReview();

    useEffect(() => {
        if (!review.transaction) return;
        review.onSendTransactionSuccess?.(review.transaction.txid);
    }, [review.transaction, review.onSendTransactionSuccess]);

    const isSendDisabled = false;

    const onSendTransaction = async () => {
        if (!review.account) return;
        if (isSendDisabled) return;

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
        >
            <ScrollToEndOnMount>
                <Button
                    isLoading={review.isSending}
                    isDisabled={isSendDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.validateForm')}
                    testID="@send/send-transaction-button"
                    onPress={onSendTransaction}
                >
                    <Translation id={review.sendButtonTranslationId} />
                </Button>
            </ScrollToEndOnMount>
        </AnimatedBox>
    );
};
