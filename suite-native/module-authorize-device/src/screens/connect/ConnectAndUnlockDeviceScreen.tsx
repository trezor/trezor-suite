import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import {
    authorizeDeviceThunk,
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { DevicesScanner } from '@suite-native/bluetooth';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

const screenContentStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isFocused = useIsFocused();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const navigation = useNavigation();

    const navigateBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    useEffect(() => {
        if (!isFocused || !isDeviceConnected) return;

        if (isDeviceAuthorized) {
            // When selected device become connected, we need to navigate out of this screen.
            navigateBack();
        } else {
            // If user cancelled the authorization, we need to authorize the device again.
            requestPrioritizedDeviceAccess({
                deviceCallback: () => dispatch(authorizeDeviceThunk()),
            });
        }
    }, [isDeviceAuthorized, isDeviceConnected, dispatch, isFocused, navigateBack]);

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
                <DevicesScanner />
            </VStack>
        </Screen>
    );
};
