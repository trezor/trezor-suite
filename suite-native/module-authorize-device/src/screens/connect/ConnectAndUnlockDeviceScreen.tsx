import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import {
    selectIsBluetoothSupportedByDevice,
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

export const ConnectAndUnlockDeviceScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
    RootStackParamList
>) => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);

    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);
    const isBluetoothButtonVisible =
        isBluetoothEnabled && (!isDeviceConnected || isBluetoothSupportedByDevice);

    const isFocused = useIsFocused();

    const navigateBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    const navigateToTurnOnAndUnlockDeviceScreen = () => {
        navigation.replace(AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice);
    };

    useEffect(() => {
        if (!isFocused || !isDeviceConnected) return;

        if (isDeviceAuthorized) {
            // When selected device become connected, we need to navigate out of this screen.
            navigateBack();
        } else {
            console.warn(' == meow == authorize device thnk needs to be replaced here ');
            // If user cancelled the authorization, we need to authorize the device again.
            // requestPrioritizedDeviceAccess({
            //     deviceCallback: () => dispatch(authorizeDeviceThunk()),
            // });
        }
    }, [isDeviceAuthorized, isDeviceConnected, isFocused, navigateBack]);

    return (
        <Screen
            header={<ConnectDeviceScreenHeader />}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            <ConnectAndUnlockDeviceScreenContent
                onConnectViaBluetooth={
                    isBluetoothButtonVisible ? navigateToTurnOnAndUnlockDeviceScreen : undefined
                }
            />
        </Screen>
    );
};
