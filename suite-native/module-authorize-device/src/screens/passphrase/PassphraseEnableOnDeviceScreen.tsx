import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { CenteredTitleHeader, IconButton, ScreenHeaderWrapper, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';
import { resetError, selectPassphraseError } from '@suite-native/device-authorization';

import { DeviceT3T1Svg } from '../../assets/passphrase/DeviceT3T1Svg';

export const PassphraseEnableOnDeviceScreen = () => {
    const passphraseError = useSelector(selectPassphraseError);

    const dispatch = useDispatch();

    const { showToast } = useToast();
    const { translate } = useTranslate();

    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleClose = useCallback(() => {
        TrezorConnect.cancel();
        dispatch(resetError());
        navigateToInitialScreen();
    }, [dispatch, navigateToInitialScreen]);

    useEffect(() => {
        if (passphraseError?.error === 'passphrase-enabling-cancelled') {
            handleClose();
            showToast({
                variant: 'error',
                icon: 'warning',
                message: translate('modulePassphrase.enablePassphrase.cancelledError'),
            });
        }
    }, [dispatch, handleClose, navigateToInitialScreen, passphraseError, showToast, translate]);

    return (
        <Screen
            screenHeader={
                <ScreenHeaderWrapper>
                    <IconButton
                        size="medium"
                        colorScheme="tertiaryElevation1"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        iconName="x"
                        onPress={handleClose}
                    />
                </ScreenHeaderWrapper>
            }
        >
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp16">
                <DeviceT3T1Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.enablePassphrase.title" />}
                    subtitle={<Translation id="modulePassphrase.enablePassphrase.subtitle" />}
                />
            </VStack>
        </Screen>
    );
};
