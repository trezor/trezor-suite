import { useCallback } from 'react';

import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { useInterceptNativeNavigation, useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

export const AuthorizeDeviceScreenHeader = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel();
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

    useInterceptNativeNavigation({ onPress: handleCancel });

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="x"
                intent="neutral"
                priority="secondary"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
                testID="@passphrase/closeButton"
            />
        </ScreenHeaderWrapper>
    );
};
