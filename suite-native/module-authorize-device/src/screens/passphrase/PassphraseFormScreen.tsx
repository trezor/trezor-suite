import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useIsConnectPopupOpened } from '@suite-native/module-connect-popup';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { PassphraseForm, useHandleUiRequestPassphraseOnDevice } from '@suite-native/passphrase';

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

    const navigateToEnterOnDevice = useCallback(() => {
        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useHandleUiRequestPassphraseOnDevice(navigateToEnterOnDevice);

    return (
        <Screen header={<AuthorizeDeviceScreenHeader />}>
            <VStack spacing="sp24">
                <Text variant="headline-md">
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
