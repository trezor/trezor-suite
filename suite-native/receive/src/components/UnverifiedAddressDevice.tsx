import React, { useCallback, useState } from 'react';
import {
    GestureEvent,
    PanGestureHandler,
    PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Pressable } from 'react-native';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';

import { UnverifiedAddressDeviceHint } from './UnverifiedAddressDeviceHint';
import { DEVICE_SCREEN_BACKGROUND_COLOR } from '../constants';
import { DevicePaginationButton } from './DevicePaginationButton';
import { isPaginationCompatibleDeviceModel } from '../types';
import { DeviceScreenContent } from './DeviceScreenContent';

type DeviceScreenAddressProps = {
    address: string;
    isAddressRevealed: boolean;
    isCardanoAddress: boolean;
};

const DEVICE_SCREEN_WIDTH = 340;
const DEVICE_SCREEN_HEIGHT = 200;

const PAN_GESTURE_THRESHOLD = 50;

const deviceFrameStyle = prepareNativeStyle(utils => ({
    width: DEVICE_SCREEN_WIDTH,
    padding: utils.spacings.extraSmall,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.large / 2,
    borderColor: utils.colors.borderElevation2,
}));

const deviceScreenStyle = prepareNativeStyle<{ isPaginationEnabled: boolean }>(
    (utils, { isPaginationEnabled }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: DEVICE_SCREEN_HEIGHT,
        paddingVertical: isPaginationEnabled ? utils.spacings.large : 40,
        maxWidth: DEVICE_SCREEN_WIDTH,
        backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
        borderRadius: utils.borders.radii.large / 2,
    }),
);

export const UnverifiedAddressDevice = ({
    address,
    isAddressRevealed,
    isCardanoAddress,
}: DeviceScreenAddressProps) => {
    const { applyStyle } = useNativeStyles();
    const [activePage, setActivePage] = useState<1 | 2>(1);

    const deviceModel = useSelector(selectDeviceModel);
    const copyToClipboard = useCopyToClipboard();

    const isPaginationEnabled = isCardanoAddress && isPaginationCompatibleDeviceModel(deviceModel);

    const handlePaginationPanGesture = useCallback(
        (panEvent: GestureEvent<PanGestureHandlerEventPayload>) => {
            if (!isPaginationEnabled || !isAddressRevealed) return;

            const { translationY } = panEvent.nativeEvent;

            if (translationY < -PAN_GESTURE_THRESHOLD) {
                setActivePage(2);
            }
            if (translationY > PAN_GESTURE_THRESHOLD) {
                setActivePage(1);
            }
        },
        [isAddressRevealed, isPaginationEnabled],
    );

    if (!deviceModel) return null;

    const handlePaginationButtonPress = () => {
        if (!isPaginationEnabled || !isAddressRevealed) return;
        setActivePage(activePage === 1 ? 2 : 1);
    };

    const handleCopyAddress = () => {
        copyToClipboard(address);
    };

    return (
        <VStack spacing="medium" alignItems="center">
            <Box style={applyStyle(deviceFrameStyle)}>
                <PanGestureHandler onGestureEvent={handlePaginationPanGesture}>
                    <Animated.View>
                        <VStack
                            spacing="large"
                            style={applyStyle(deviceScreenStyle, { isPaginationEnabled })}
                        >
                            <Pressable onLongPress={isAddressRevealed ? handleCopyAddress : null}>
                                <DeviceScreenContent
                                    address={address}
                                    isAddressRevealed={isAddressRevealed}
                                    activePage={activePage}
                                    isPaginationEnabled={isPaginationEnabled}
                                />
                            </Pressable>
                            {isPaginationEnabled && (
                                <DevicePaginationButton
                                    isAddressRevealed={isAddressRevealed}
                                    activePage={activePage}
                                    deviceModel={deviceModel}
                                    onPress={handlePaginationButtonPress}
                                />
                            )}
                        </VStack>
                    </Animated.View>
                </PanGestureHandler>
            </Box>

            {isAddressRevealed && <UnverifiedAddressDeviceHint />}
        </VStack>
    );
};
