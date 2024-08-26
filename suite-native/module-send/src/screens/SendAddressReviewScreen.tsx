import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { isRejected } from '@reduxjs/toolkit';

import {
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { Box, Button, IconButton, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import {
    AccountsRootState,
    DeviceRootState,
    SendRootState,
    cancelSignSendFormTransactionThunk,
} from '@suite-common/wallet-core';
import { ConfirmOnTrezorImage } from '@suite-native/device';
import { useNativeStyles } from '@trezor/styles';

import { signTransactionThunk } from '../sendFormThunks';
import { selectIsFirstTransactionAddressConfirmed } from '../selectors';
import { SlidingFooterOverlay } from '../components/SlidingFooterOverlay';
import { AddressReviewStep } from '../components/AddressReviewStep';
import { CompareAddressHelpButton } from '../components/CompareAddressHelpButton';
import { AddressOriginHelpButton } from '../components/AddressOriginHelpButton';

const NUMBER_OF_STEPS = 3;
const OVERLAY_INITIAL_POSITION = 160;
const OVERLAY_STEP_HEIGHT = 105;

export const SendAddressReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>) => {
    const { accountKey, transaction } = route.params;
    const { utils } = useNativeStyles();
    const { showToast } = useToast();
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const [step, setStep] = useState(1);
    const areAllStepsDone = step === NUMBER_OF_STEPS;

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsFirstTransactionAddressConfirmed(state, accountKey),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey });
        }
    }, [isAddressConfirmed, accountKey, navigation]);

    const handleNextStep = async () => {
        setStep(prevStep => prevStep + 1);

        if (step === NUMBER_OF_STEPS - 1) {
            const response = await dispatch(
                signTransactionThunk({
                    accountKey,
                    feeLevel: transaction,
                }),
            );

            if (isRejected(response)) {
                // TODO: display error message based on the error code
                showToast({
                    variant: 'error',
                    message: 'Something went wrong',
                    icon: 'closeCircle',
                });

                navigation.navigate(SendStackRoutes.SendAccounts);
            }
        }
    };

    const handleGoBack = () => {
        if (areAllStepsDone) {
            //Navigation is handled by signTransactionThunk response.
            dispatch(cancelSignSendFormTransactionThunk());

            return;
        }

        navigation.goBack();
    };

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            subheader={
                <ScreenSubHeader
                    leftIcon={
                        <IconButton
                            iconName="chevronLeft"
                            size="medium"
                            colorScheme="tertiaryElevation0"
                            onPress={handleGoBack}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel"
                        />
                    }
                    content={translate('moduleSend.review.outputs.title')}
                />
            }
        >
            <Box flex={1} justifyContent="space-between">
                <VStack justifyContent="center" alignItems="center" spacing="large">
                    <Text variant="titleSmall">
                        <Translation id="moduleSend.review.address.title" />
                    </Text>
                    <VStack spacing="medium">
                        <AddressReviewStep
                            stepNumber={1}
                            translationId="moduleSend.review.address.step1"
                            rightIcon={<AddressOriginHelpButton />}
                        />

                        <AddressReviewStep
                            stepNumber={2}
                            translationId="moduleSend.review.address.step2"
                            rightIcon={<CompareAddressHelpButton />}
                        />
                        <AddressReviewStep translationId="moduleSend.review.address.step3" />
                    </VStack>

                    {!areAllStepsDone && (
                        <SlidingFooterOverlay
                            currentStepIndex={step}
                            stepHeight={OVERLAY_STEP_HEIGHT}
                            initialOffset={OVERLAY_INITIAL_POSITION}
                        >
                            <Button onPress={handleNextStep}>
                                <Translation id="generic.buttons.next" />
                            </Button>
                        </SlidingFooterOverlay>
                    )}
                </VStack>
                {/* TODO: improve the illustration: https://github.com/trezor/trezor-suite/issues/13965 */}
                {areAllStepsDone && <ConfirmOnTrezorImage />}
            </Box>
        </Screen>
    );
};
