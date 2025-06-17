import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import { selectIsDeviceAuthorized, selectIsDeviceConnected } from '@suite-common/wallet-core';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { restartDiscoveryThunk } from '@suite-common/wallet-core';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

export const ConnectAndUnlockDeviceScreen = ({
    route: { params },
    navigation,
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
    RootStackParamList
>) => {
    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isFocused = useIsFocused();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const dispatch = useDispatch();

    const navigateBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    const navigateToConnectBluetoothDeviceScreen = () => {
        navigation.replace(AuthorizeDeviceStackRoutes.ConnectBluetoothDevice);
    };

    console.log('ConnectAndUnlockDeviceScreen: isDeviceAuthorized', isDeviceAuthorized);

    useEffect(() => {
        if (!isFocused || !isDeviceConnected) return;

        if (isDeviceAuthorized) {
            // When selected device become connected, we need to navigate out of this screen.
            navigateBack();
        } else {
            console.log('ConnectAndUnlockDeviceScreen: restartDiscoveryThunk');
            dispatch(restartDiscoveryThunk());
            // If user cancelled the authorization, we need to authorize the device again.
            // requestPrioritizedDeviceAccess({
            //     deviceCallback: () => dispatch(authorizeDeviceThunk()),
            // });
        }
    }, [isDeviceAuthorized, isDeviceConnected, isFocused, navigateBack]);

    return (
        <Screen
            header={
                <ConnectDeviceScreenHeader
                    onCancelNavigationTarget={params?.onCancelNavigationTarget}
                />
            }
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            <ConnectAndUnlockDeviceScreenContent
                onConnectViaBluetooth={
                    isBluetoothEnabled ? navigateToConnectBluetoothDeviceScreen : undefined
                }
            />
        </Screen>
    );
};
