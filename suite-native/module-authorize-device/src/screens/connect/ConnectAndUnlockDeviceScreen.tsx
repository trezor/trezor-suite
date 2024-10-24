import { useCallback, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import {
    authorizeDeviceThunk,
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { DevicesScanner, isBluetoothEnabled } from '@suite-native/bluetooth';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.6;

const screenContentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp40,
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const ConnectAndUnlockDeviceScreen = ({
    route: { params },
}: StackProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice
>) => {
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
            screenHeader={
                <ConnectDeviceScreenHeader
                    onCancelNavigationTarget={params?.onCancelNavigationTarget}
                />
            }
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <VStack style={applyStyle(screenContentStyle)}>
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
                </Text>
                {isBluetoothEnabled ? (
                    <DevicesScanner />
                ) : (
                    <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
                )}
            </VStack>
        </Screen>
    );
};
