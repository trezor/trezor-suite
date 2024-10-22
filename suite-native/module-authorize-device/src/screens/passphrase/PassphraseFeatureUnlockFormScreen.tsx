import { Screen, ScreenHeader } from '@suite-native/navigation';
import { IconButton, Text, VStack } from '@suite-native/atoms';
import TrezorConnect from '@trezor/connect';
import { useAuthorizationGoBack } from '@suite-native/device-authorization';
import { Translation, useTranslate } from '@suite-native/intl';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';

export const PassphraseFeatureUnlockFormScreen = () => {
    const { handleGoBack } = useAuthorizationGoBack();
    const isConnectPopupOpened = useIsConnectPopupOpened();

    const { translate } = useTranslate();

    const handleClose = () => {
        TrezorConnect.cancel();
        handleGoBack();
    };

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <IconButton
                        iconName="x"
                        onPress={handleClose}
                        colorScheme="tertiaryElevation0"
                        size="medium"
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    />
                </ScreenHeader>
            }
        >
            <VStack spacing="sp24">
                <Text variant="titleMedium">
                    <Translation id="modulePassphrase.passphraseFeatureUnlock.title" />
                </Text>
                <PassphraseForm
                    inputLabel={translate('modulePassphrase.form.createWalletInputLabel')}
                    noPassphraseEnabled={isConnectPopupOpened}
                />
            </VStack>
        </Screen>
    );
};
