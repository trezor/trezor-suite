import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { InlineAlertBox, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    PassphraseForm,
    PassphraseScreenHeader,
    useHandleUiRequestPassphraseOnDevice,
} from '@suite-native/passphrase';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseVerifyEmptyWalletScreen = () => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();

    const handleAfterSubmit = () => {
        navigation.navigate(PassphraseStackRoutes.PassphraseConfirmOnTrezor);
    };

    const navigateToEnterOnDevice = useCallback(() => {
        navigation.navigate(PassphraseStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useHandleUiRequestPassphraseOnDevice(navigateToEnterOnDevice);

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack marginTop="sp8" spacing="sp16">
                <TitleHeader
                    title={
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.title" />
                    }
                    subtitle={
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.description" />
                    }
                    titleVariant="headline-md"
                />
                <InlineAlertBox
                    variant="warning"
                    title={
                        <Translation
                            id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.alertTitle"
                            values={{
                                bold: chunks => <Text variant="body-sm-strong">{chunks}</Text>,
                            }}
                        />
                    }
                />
                <PassphraseForm
                    inputLabel={translate('modulePassphrase.form.verifyPassphraseInputLabel')}
                    onAfterSubmit={handleAfterSubmit}
                />
            </VStack>
        </Screen>
    );
};
