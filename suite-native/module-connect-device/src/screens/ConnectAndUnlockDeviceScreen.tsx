import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen } from '@suite-native/navigation';
import {
    selectDevice,
    selectIsDeviceAuthorized,
    authorizeDeviceThunk,
} from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

import { ConnectDeviceScreenHeader } from '../components/ConnectDeviceScreenHeader';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.6;

const screenContentStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused && device && !isDeviceAuthorized) {
            // When user cancelled the authorization, we need to authorize the device again.
            requestPrioritizedDeviceAccess(() => dispatch(authorizeDeviceThunk()));
        }
    }, [isDeviceAuthorized, device, dispatch, isFocused]);

    return (
        <Screen
            screenHeader={<ConnectDeviceScreenHeader />}
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <VStack style={applyStyle(screenContentStyle)}>
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
                </Text>
                <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
            </VStack>
        </Screen>
    );
};
