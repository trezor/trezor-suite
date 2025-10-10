import { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectIsDeviceAuthorized } from '@suite-common/wallet-core';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect, { DEVICE } from '@trezor/connect';

import { ConnectDeviceScreenHeader } from './ConnectDeviceScreenHeader';

type ConnectDeviceScreenProps = {
    children: ReactNode;
    helpButton?: ReactNode;
};

export const ConnectDeviceScreen = ({ children, helpButton }: ConnectDeviceScreenProps) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);

    const onDeviceConnect = useCallback(() => {
        // By waiting for authorized device (meaning that discovery is already running),
        // we will redirect at appropriate time (could be resolved by connecting screen instead).
        // This is needed because remembered devices are ignored by deviceConnectionMiddleware
        if (isDeviceAuthorized) {
            navigateToInitialScreen();
        }
    }, [isDeviceAuthorized, navigateToInitialScreen]);

    useFocusEffect(
        useCallback(() => {
            TrezorConnect.on(DEVICE.CONNECT, onDeviceConnect);

            return () => TrezorConnect.off(DEVICE.CONNECT, onDeviceConnect);
        }, [onDeviceConnect]),
    );

    return (
        <Screen
            header={<ConnectDeviceScreenHeader helpButton={helpButton} />}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            {children}
        </Screen>
    );
};
