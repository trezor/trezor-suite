import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    selectIsBluetoothSupportedByDevice,
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { selectBluetoothPermissionStatus } from '@suite-native/bluetooth';
import {
    ConnectAndUnlockDeviceScreenContent,
    TurnOnAndUnlockDeviceScreenContent,
} from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

export const DeviceConnectionGuardScreen = ({
    navigation,
    route: { params },
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
    RootStackParamList
>) => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);

    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);
    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);

    const isBluetoothVariantVisible =
        isBluetoothEnabled &&
        bluetoothPermissionStatus === 'granted' &&
        isBluetoothSupportedByDevice;

    useFocusEffect(
        useCallback(() => {
            if (isDeviceConnected && isDeviceAuthorized) {
                navigation.goBack();
            }
        }, [isDeviceConnected, isDeviceAuthorized, navigation]),
    );

    return (
        <Screen
            header={
                <ConnectDeviceScreenHeader
                    onCancelNavigationTarget={params?.onCancelNavigationTarget}
                    helpButton={null}
                />
            }
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            {isBluetoothVariantVisible ? (
                <TurnOnAndUnlockDeviceScreenContent />
            ) : (
                <ConnectAndUnlockDeviceScreenContent />
            )}
        </Screen>
    );
};
