import { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useAlert } from '@suite-native/alerts';
import { Box, Button, HStack, IconButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import TrezorConnect, { DEVICE, UI_REQUEST, UI_RESPONSE } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { PIN_HELP_URL } from '@trezor/urls';

import { selectPinRequestId } from '../deviceAuthorizationSlice';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    paddingTop: utils.spacings.sp24,
}));

const ANIMATION_DURATION = 100;

type PinFormControlButtonsProps = {
    onSuccess?: () => void;
};

export const PinFormControlButtons = ({ onSuccess }: PinFormControlButtonsProps) => {
    const [containerHeight, setContainerHeight] = useState(0);
    const animatedHeight = useSharedValue(0);

    const { applyStyle } = useNativeStyles();
    const requestId = useSelector(selectPinRequestId);

    const openLink = useOpenLink();
    const { showAlert } = useAlert();
    const { handleSubmit, getValues, watch, setValue, reset } = useFormContext();

    const handleSuccess = useCallback(() => {
        onSuccess?.();
        reset();
    }, [onSuccess, reset]);

    const handleDeviceChange = useCallback(() => {
        handleSuccess();
    }, [handleSuccess]);

    useEffect(() => {
        TrezorConnect.on(DEVICE.CHANGED, handleDeviceChange);

        return () => TrezorConnect.off(DEVICE.CHANGED, handleDeviceChange);
    }, [handleDeviceChange]);

    const handleInvalidPin = useCallback(() => {
        reset();
        showAlert({
            title: <Translation id="moduleConnectDevice.pinScreen.wrongPinAlert.title" />,
            description: (
                <Translation id="moduleConnectDevice.pinScreen.wrongPinAlert.description" />
            ),
            pictogramVariant: 'critical',
            primaryButtonTitle: (
                <Translation id="moduleConnectDevice.pinScreen.wrongPinAlert.button.tryAgain" />
            ),
            onPressPrimaryButton: () => {
                // Ask for new PIN entry after 3 wrong attempts.
                // requestPrioritizedDeviceAccess({
                //     deviceCallback: () => dispatch(authorizeDeviceThunk()),
                // });
            },
            secondaryButtonTitle: (
                <Translation id="moduleConnectDevice.pinScreen.wrongPinAlert.button.help" />
            ),
            onPressSecondaryButton: () => {
                openLink(PIN_HELP_URL);
            },
        });
    }, [openLink, reset, showAlert]);

    useEffect(() => {
        // UI_REQUEST.INVALID_PIN is emitted when user enters wrong PIN for first 3 attempts.
        // See https://github.com/trezor/trezor-suite/blob/0498c2ef4c0a61ff56fc60cff0f545636592814d/packages/connect/src/core/index.ts#L598
        TrezorConnect.on(UI_REQUEST.INVALID_PIN, handleInvalidPin);

        return () => TrezorConnect.off(UI_REQUEST.INVALID_PIN, handleInvalidPin);
    }, [handleInvalidPin]);

    const onSubmit = handleSubmit(values => {
        TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_PIN, payload: values.pin, requestId });
    });

    const handleDelete = () => {
        const pin = getValues('pin');
        setValue('pin', pin.slice(0, -1));
    };

    const pinLength = watch('pin').length;

    const cardAnimatedStyle = useAnimatedStyle(() => {
        animatedHeight.value = withTiming(pinLength ? containerHeight : 0, {
            duration: ANIMATION_DURATION,
        });

        return {
            height: animatedHeight.value,
        };
    }, [pinLength, containerHeight]);

    const handleOnLayout = (event: LayoutChangeEvent) =>
        setContainerHeight(event.nativeEvent.layout.height);

    return (
        <Animated.View style={cardAnimatedStyle}>
            {!!pinLength && (
                <Animated.View
                    entering={FadeIn.delay(ANIMATION_DURATION / 2)}
                    exiting={FadeOut}
                    style={applyStyle(buttonsWrapperStyle)}
                >
                    <HStack spacing="sp16" onLayout={handleOnLayout} paddingBottom="sp24">
                        <IconButton
                            onPress={handleDelete}
                            iconName="backspace"
                            intent="neutral"
                            priority="secondary"
                        />
                        <Box flex={1}>
                            <Button onPress={onSubmit}>
                                <Translation id="moduleConnectDevice.pinScreen.form.submitButton" />
                            </Button>
                        </Box>
                    </HStack>
                </Animated.View>
            )}
        </Animated.View>
    );
};
