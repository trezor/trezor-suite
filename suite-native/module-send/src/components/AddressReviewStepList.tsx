import { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, View, AppState } from 'react-native';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import {
    RootStackParamList,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { nativeSpacings } from '@trezor/theme';

import {
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '../selectors';
import { SlidingFooterOverlay } from '../components/SlidingFooterOverlay';
import { AddressReviewStep } from '../components/AddressReviewStep';
import { CompareAddressHelpButton } from '../components/CompareAddressHelpButton';
import { AddressOriginHelpButton } from '../components/AddressOriginHelpButton';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';

const NUMBER_OF_STEPS = 3;
const OVERLAY_INITIAL_POSITION = 170;
const LIST_VERTICAL_SPACING = nativeSpacings.sp16;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];
type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

export const AddressReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const navigation = useNavigation<NavigationProps>();

    const [childHeights, setChildHeights] = useState<number[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview();
    const setWasAppLeftDuringReview = useSetAtom(wasAppLeftDuringReviewAtom);
    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
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

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsReceiveAddressOutputConfirmed(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey, tokenContract });
        }
    }, [isAddressConfirmed, accountKey, navigation, tokenContract]);

    const handleReadItemListHeight = (event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;
        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + LIST_VERTICAL_SPACING;

            return newHeights;
        });
    };

    const handleNextStep = () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            handleOnDeviceTransactionReview();
        }
    };

    return (
        <>
            <View>
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    <AddressReviewStep
                        stepNumber={1}
                        onLayout={event => handleReadItemListHeight(event, 0)}
                        translationId="moduleSend.review.address.step1"
                        rightIcon={<AddressOriginHelpButton />}
                    />

                    <AddressReviewStep
                        stepNumber={2}
                        onLayout={event => handleReadItemListHeight(event, 1)}
                        translationId="moduleSend.review.address.step2"
                        rightIcon={<CompareAddressHelpButton />}
                    />
                    <AddressReviewStep
                        translationId="moduleSend.review.address.step3"
                        onLayout={event => handleReadItemListHeight(event, 2)}
                    />
                </VStack>
            </View>
            {!areAllStepsDone && (
                <SlidingFooterOverlay
                    currentStepIndex={stepIndex}
                    stepHeights={childHeights}
                    initialOffset={OVERLAY_INITIAL_POSITION}
                >
                    <Button onPress={handleNextStep} testID="@send/address-review-continue">
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </>
    );
};
