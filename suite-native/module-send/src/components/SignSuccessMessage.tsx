import { useSelector } from 'react-redux';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useEffect } from 'react';

import { Text } from '@suite-native/atoms';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useScrollView } from '@suite-native/navigation';

import { ReviewSuccessSvg } from '../../assets/ReviewSuccessSvg';
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
        <Animated.View entering={SlideInDown}>
            <VStack paddingHorizontal="sp24" alignItems="center" paddingBottom="sp24">
                <ReviewSuccessSvg />
                <Text variant="highlight" textAlign="center">
                    <Translation id="moduleSend.review.outputs.successMessage" />
                </Text>
            </VStack>
        </Animated.View>
    );
};
