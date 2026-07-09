import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
    type DeviceRootState,
    selectDeviceButtonRequestsCodes,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/device';
import {
    AuthorizeDeviceStackRoutes,
    type NavigateParameters,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    type TransactionDetailStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    RootStackParamList
>;

type UseDeviceGuardedSignParams = {
    // The signing action to run once the device is connected and authorized.
    sign: () => Promise<void>;
    // Where the connection guard returns the user if they abort connecting the device.
    cancelNavigationTarget: NavigateParameters<RootStackParamList>;
};

/**
 * Runs a signing action behind the native device-connection guard: `requestSign` routes through the
 * DeviceConnectionGuard screen (which connects/unlocks the device if needed, or returns immediately
 * when it's already authorized), and `sign` runs once this screen regains focus with an authorized
 * device. Exposes `isSigning` and `isWaitingForDevice` (the device is showing a button request) for
 * the caller's UI. Mirrors the pattern the send/stellar flows use inline.
 */
export const useDeviceGuardedSign = ({
    sign,
    cancelNavigationTarget,
}: UseDeviceGuardedSignParams) => {
    const navigation = useNavigation<NavigationProp>();
    const isDeviceConnectedAndAuthorized = useSelector((state: DeviceRootState) =>
        selectIsDeviceConnectedAndAuthorized(state),
    );
    const buttonRequestCodes = useSelector((state: DeviceRootState) =>
        selectDeviceButtonRequestsCodes(state),
    );

    const [isSigning, setIsSigning] = useState(false);
    const pendingSignRef = useRef(false);
    const isWaitingForDevice = isSigning && buttonRequestCodes.length > 0;

    const runSign = useCallback(async () => {
        setIsSigning(true);
        try {
            await sign();
        } finally {
            setIsSigning(false);
        }
    }, [sign]);

    // When the screen regains focus after the device-connection guard, execute the pending sign.
    useFocusEffect(
        useCallback(() => {
            if (pendingSignRef.current && isDeviceConnectedAndAuthorized) {
                pendingSignRef.current = false;
                runSign();
            }
        }, [isDeviceConnectedAndAuthorized, runSign]),
    );

    const requestSign = useCallback(() => {
        pendingSignRef.current = true;

        // The guard shows the connect screen if needed, or goes back immediately if the device is
        // already connected — either way the focus effect above continues with signing.
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            params: { onCancelNavigationTarget: cancelNavigationTarget },
        });
    }, [navigation, cancelNavigationTarget]);

    return { isSigning, isWaitingForDevice, requestSign };
};
