import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import { selectIsDeviceAuthorized, selectIsDeviceConnected } from '@suite-common/wallet-core';
import { isBluetoothEnabled } from '@suite-native/bluetooth';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

export const ConnectAndUnlockDeviceScreen = ({
    route: { params },
    navigation,
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
    RootStackParamList
>) => {
    // const dispatch = useDispatch();

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isFocused = useIsFocused();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const navigateBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    const navigateToConnectBluetoothDeviceScreen = () => {
        navigation.replace(AuthorizeDeviceStackRoutes.ConnectBluetoothDevice);
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
