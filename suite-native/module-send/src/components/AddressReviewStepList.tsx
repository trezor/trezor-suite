import { useCallback, useState } from 'react';
import { AppState, View } from 'react-native';
import { useSelector } from 'react-redux';

import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { AddressOriginHelpButton } from './AddressOriginHelpButton';
import { AddressReviewStep } from './AddressReviewStep';
import { CompareAddressHelpButton } from './CompareAddressHelpButton';
import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';

const NUMBER_OF_STEPS = 3;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];

export const AddressReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract, transaction } = route.params;

    const [stepIndex, setStepIndex] = useState(0);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);
    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview({
        accountKey,
        tokenContract,
        transaction,
    });
    const setWasAppLeftDuringReview = useSetAtom(wasAppLeftDuringReviewAtom);
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'send', accountKey, tokenContract),
    );

    useFocusEffect(
        useCallback(() => {
            setWasAppLeftDuringReview(false);

            const subscription = AppState.addEventListener('change', nextAppState => {
                if (nextAppState === 'background') {
                    setWasAppLeftDuringReview(true);
                }
            });

            return () => {
                subscription.remove();
            };
        }, [setWasAppLeftDuringReview]),
    );

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1 || isTransactionReviewInProgress;

    const handleNextStep = () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            handleOnDeviceTransactionReview();
        }
    };

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <AddressReviewStep
                    stepNumber={1}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                    translationId="moduleSend.review.address.step1"
                    rightIcon={<AddressOriginHelpButton />}
                />
                <AddressReviewStep
                    stepNumber={2}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                    translationId="moduleSend.review.address.step2"
                    rightIcon={<CompareAddressHelpButton />}
                />
                <AddressReviewStep
                    translationId="moduleSend.review.address.step3"
                    onLayout={event => handleReadListItemHeight(event, 2)}
                />
            </VStack>
            {!areAllStepsDone && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button onPress={handleNextStep} testID="@send/address-review-continue">
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
