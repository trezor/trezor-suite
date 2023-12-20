import React, { useCallback, useState } from 'react';
import {
    GestureEvent,
    PanGestureHandler,
    PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOutUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import { selectDeviceModel } from '@suite-common/wallet-core';

import { UnverifiedAddressDeviceHint } from './UnverifiedAddressDeviceHint';
import { DevicePaginationButton } from '../DevicePaginationButton';
import { isPaginationCompatibleDeviceModel } from '../../types';
import { DeviceScreenContent } from '../DeviceScreen/DeviceScreenContent';
import { ReceiveProgressStep, isAddressRevealed } from '../../hooks/useReceiveProgressSteps';
import { useUnverifiedAddressDeviceAnimations } from './useUnverifiedAddressDeviceAnimations';

type UnverifiedAddressDeviceProps = {
    address: string;
    isCardanoAddress: boolean;
    receiveProgressStep: ReceiveProgressStep;
};

const PAN_GESTURE_THRESHOLD = 50;

export const UnverifiedAddressDevice = ({
    address,
    isCardanoAddress,
    receiveProgressStep,
}: UnverifiedAddressDeviceProps) => {
    const [activePage, setActivePage] = useState<1 | 2>(1);
    const { deviceFrameStyle, deviceScreenStyle, buttonsStyle, isHintVisible } =
        useUnverifiedAddressDeviceAnimations({
            receiveProgressStep,
            isCardanoAddress,
        });

    const deviceModel = useSelector(selectDeviceModel);

    const isPaginationEnabled = isCardanoAddress && isPaginationCompatibleDeviceModel(deviceModel);

    const isRevealedAddress = isAddressRevealed(receiveProgressStep);

    const handlePaginationPanGesture = useCallback(
        (panEvent: GestureEvent<PanGestureHandlerEventPayload>) => {
            if (!isPaginationEnabled || !isRevealedAddress) return;

            const { translationY } = panEvent.nativeEvent;

            if (translationY < -PAN_GESTURE_THRESHOLD) {
                setActivePage(2);
            }
            if (translationY > PAN_GESTURE_THRESHOLD) {
                setActivePage(1);
            }
        },
        [isRevealedAddress, isPaginationEnabled],
    );

    if (!deviceModel) return null;

    const handlePaginationButtonPress = () => {
        if (!isPaginationEnabled || !isAddressRevealed) return;
        setActivePage(activePage === 1 ? 2 : 1);
    };

    return (
        <VStack spacing="medium" alignItems="center">
            <Animated.View style={deviceFrameStyle}>
                <PanGestureHandler onGestureEvent={handlePaginationPanGesture}>
                    <Animated.View>
                        <Animated.View style={deviceScreenStyle}>
                            <DeviceScreenContent
                                address={address}
                                activePage={activePage}
                                isPaginationEnabled={isPaginationEnabled}
                                receiveProgressStep={receiveProgressStep}
                            />
                            {isPaginationEnabled && (
                                <DevicePaginationButton
                                    isVisible={isRevealedAddress}
                                    activePage={activePage}
                                    deviceModel={deviceModel}
                                    onPress={handlePaginationButtonPress}
                                />
                            )}
                        </Animated.View>
                    </Animated.View>
                </PanGestureHandler>
            </Animated.View>
            {isHintVisible && (
                <Animated.View style={buttonsStyle} entering={FadeIn} exiting={FadeOutUp}>
                    <UnverifiedAddressDeviceHint />
                </Animated.View>
            )}
        </VStack>
    );
};
