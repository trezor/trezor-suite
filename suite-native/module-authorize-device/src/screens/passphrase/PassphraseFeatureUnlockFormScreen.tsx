import { IconButton, ScreenHeaderWrapper, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';
import { Screen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';

export const PassphraseFeatureUnlockFormScreen = () => {
    const isConnectPopupOpened = useIsConnectPopupOpened();

    const { translate } = useTranslate();

    const handleClose = () => {
        TrezorConnect.cancel();
    };

    return (
        <Screen
            header={
                <ScreenHeaderWrapper>
                    <IconButton
                        iconName="x"
                        onPress={handleClose}
                        colorScheme="tertiaryElevation0"
                        size="medium"
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    />
                </ScreenHeaderWrapper>
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
