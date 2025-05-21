import { useNavigation } from '@react-navigation/native';

import { IconButton, ScreenHeaderWrapper, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseFeatureUnlockFormScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const isConnectPopupOpened = useIsConnectPopupOpened();

    const { translate } = useTranslate();

    const handleClose = () => {
        TrezorConnect.cancel();
        navigateToInitialScreen();
    };

    const handleAfterSubmit = () => {
        navigation.push(AuthorizeDeviceStackRoutes.PassphraseConfirmFeatureUnlockOnTrezor);
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
                    onAfterSubmit={handleAfterSubmit}
                />
            </VStack>
        </Screen>
    );
};
