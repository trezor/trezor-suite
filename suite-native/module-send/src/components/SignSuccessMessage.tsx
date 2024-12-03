import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { LottieAnimation, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useScrollView } from '@suite-native/navigation';

import sendArrowsLottie from '../../assets/send-arrows-lottie.json';
import { selectIsTransactionAlreadySigned } from '../selectors';

export const SignSuccessMessage = () => {
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const scrollView = useScrollView();

    useEffect(() => {
        if (scrollView && isTransactionAlreadySigned) {
            // on success scroll to the end so the message is visible
            scrollView.scrollToEnd({ animated: true });
        }
    }, [isTransactionAlreadySigned, scrollView]);

    if (!isTransactionAlreadySigned) return null;

    return (
        <VStack
            paddingTop="sp8"
            paddingHorizontal="sp24"
            paddingBottom="sp32"
            alignItems="center"
            spacing="sp24"
        >
            <LottieAnimation source={sendArrowsLottie} size="small" />
            <Text variant="highlight" textAlign="center">
                <Translation id="moduleSend.review.outputs.successMessage" />
            </Text>
        </VStack>
    );
};
