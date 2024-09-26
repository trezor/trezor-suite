import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { isRejected } from '@reduxjs/toolkit';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { nativeSpacings } from '@trezor/theme';
import { useToast } from '@suite-native/toasts';

import {
    cleanupSendFormThunk,
    signTransactionNativeThunk as signTransactionThunk,
} from '../sendFormThunks';
import { selectIsFirstTransactionAddressConfirmed } from '../selectors';
import { SlidingFooterOverlay } from '../components/SlidingFooterOverlay';
import { AddressReviewStep } from '../components/AddressReviewStep';
import { CompareAddressHelpButton } from '../components/CompareAddressHelpButton';
import { AddressOriginHelpButton } from '../components/AddressOriginHelpButton';

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
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const [childHeights, setChildHeights] = useState<number[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const { showToast } = useToast();

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1;
    const isLayoutReady = childHeights.length === NUMBER_OF_STEPS;
    const { accountKey, transaction } = route.params;

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
                const connectErrorCode = response.payload?.connectErrorCode;
                // In case that the signing review is interrupted, restart the flow so user can try again.
                if (
                    connectErrorCode === 'Failure_PinCancelled' || // User cancelled the pin entry on device
                    connectErrorCode === 'Method_Cancel' || // User canceled the pin entry in the app UI.
                    connectErrorCode === 'Failure_ActionCancelled' // Device got locked before the review was finished.
                ) {
                    showToast({
                        message: <Translation id="moduleSend.review.lockedToast" />,
                        variant: 'error',
                        icon: 'closeCircle',
                    });
                    navigation.navigate(SendStackRoutes.SendAddressReview, {
                        accountKey,
                        transaction,
                    });
                    setStepIndex(0);
                    dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: false }));

                    return;
                }

                // Review was exited or cancelled on purpose.
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey,
                    closeActionType: 'back',
                });
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
                    <Button onPress={handleNextStep}>
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </>
    );
};
