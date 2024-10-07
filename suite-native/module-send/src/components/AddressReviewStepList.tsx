import { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, View, AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';
import { isRejected } from '@reduxjs/toolkit';
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
    cleanupSendFormThunk,
    signTransactionNativeThunk as signTransactionThunk,
} from '../sendFormThunks';
import { selectIsFirstTransactionAddressConfirmed } from '../selectors';
import { SlidingFooterOverlay } from '../components/SlidingFooterOverlay';
import { AddressReviewStep } from '../components/AddressReviewStep';
import { CompareAddressHelpButton } from '../components/CompareAddressHelpButton';
import { AddressOriginHelpButton } from '../components/AddressOriginHelpButton';
import { useHandleSendReviewFailure } from '../hooks/useHandleSendReviewFailure';
import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';

const NUMBER_OF_STEPS = 3;
const OVERLAY_INITIAL_POSITION = 75;
const LIST_VERTICAL_SPACING = nativeSpacings.sp16;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];
type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

export const AddressReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, transaction } = route.params;
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const [childHeights, setChildHeights] = useState<number[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const handleSendReviewFailure = useHandleSendReviewFailure({ accountKey, transaction });
    const setWasAppLeftDuringReview = useSetAtom(wasAppLeftDuringReviewAtom);

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

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1;
    const isLayoutReady = childHeights.length === NUMBER_OF_STEPS;

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsFirstTransactionAddressConfirmed(state, accountKey),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey });
        }
    }, [isAddressConfirmed, accountKey, navigation]);

    const handleReadItemListHeight = (event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;
        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + LIST_VERTICAL_SPACING;

            return newHeights;
        });
    };

    const restartAddressReview = () => {
        setStepIndex(0);
        dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: false }));
    };

    const handleNextStep = async () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            const response = await dispatch(
                signTransactionThunk({
                    accountKey,
                    feeLevel: transaction,
                }),
            );

            if (isRejected(response)) {
                restartAddressReview();
                handleSendReviewFailure(response);
            }
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
                    isLayoutReady={isLayoutReady}
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
