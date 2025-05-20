import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { CenteredTitleHeader, IconButton, ScreenHeaderWrapper, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

export const PassphraseEnableOnDeviceScreen = () => {
    const discovery = useSelector(selectDiscoveryByDevicePath);

    const { showToast } = useToast();
    const { translate } = useTranslate();

    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleClose = useCallback(() => {
        TrezorConnect.cancel();
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

    useEffect(() => {
        if (discovery?.status === 'cancelled') {
            handleClose();
            showToast({
                variant: 'error',
                icon: 'warning',
                message: translate('modulePassphrase.enablePassphrase.cancelledError'),
            });
        }
    }, [discovery?.status, handleClose, navigateToInitialScreen, showToast, translate]);

    return (
        <Screen
            header={
                <ScreenHeaderWrapper>
                    <IconButton
                        size="medium"
                        colorScheme="tertiaryElevation0"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        iconName="x"
                        onPress={handleClose}
                    />
                </ScreenHeaderWrapper>
            }
        >
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp24">
                <ConfirmOnTrezorAnimation />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.enablePassphrase.title" />}
                    subtitle={<Translation id="modulePassphrase.enablePassphrase.subtitle" />}
                />
            </VStack>
        </Screen>
    );
};
