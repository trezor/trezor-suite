import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { PassphraseForm } from '@suite-native/passphrase';

import { AuthorizeDeviceScreenHeader } from '../../components/AuthorizeDeviceScreenHeader';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseFormScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const isConnectPopupOpened = useIsConnectPopupOpened();

    const { translate } = useTranslate();

    const handleAfterSubmit = () => {
        navigation.push(AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor);
    };

    return (
        <Screen header={<AuthorizeDeviceScreenHeader />}>
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
