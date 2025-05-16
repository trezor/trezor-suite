import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { selectIsDeviceAuthorized, selectIsDeviceConnected } from '@suite-common/wallet-core';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

export const ConnectAndUnlockDeviceScreen = ({
    route: { params },
}: StackProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice
>) => {
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
            console.log(' == meow == authorize device thnk needs to be replaced here ');
            // If user cancelled the authorization, we need to authorize the device again.
            // requestPrioritizedDeviceAccess({
            //     deviceCallback: () => dispatch(authorizeDeviceThunk()),
            // });
        }
    }, [isDeviceAuthorized, isDeviceConnected, dispatch, isFocused, navigateBack]);

    return (
        <Screen
            header={
                <ConnectDeviceScreenHeader
                    onCancelNavigationTarget={params?.onCancelNavigationTarget}
                />
            }
            noHorizontalPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            <ConnectAndUnlockDeviceScreenContent />
        </Screen>
    );
};
