import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { useAlert } from '@suite-native/alerts';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useTranslate } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    type DeviceSettingsStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.FirmwareLanguageStack,
    RootStackParamList
>;

export const useFirmwareLanguage = () => {
    const navigation = useNavigation<NavigationProps>();

    const { showToast } = useToast();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const changeFirmwareLanguage = useCallback(
        async (language: Locale) => {
            const result = await requestPrioritizedDeviceAccess(() =>
                TrezorConnect.changeLanguage({ language }),
            );

            if (!result.success) {
                return;
            }

            const unwrappedResult = result.payload;
            if (unwrappedResult.success) {
                showToast({
                    variant: 'default',
                    message: translate('firmware.changeLanguage.success', {
                        languageName: LANGUAGES[language].name,
                    }),
                });
                navigation.goBack();
            } else {
                const errorCode = unwrappedResult.error.code;
                if (
                    errorCode === 'Failure_ActionCancelled' ||
                    errorCode === 'Failure_PinCancelled' ||
                    errorCode === 'Method_Interrupted'
                ) {
                    navigation.goBack();
                } else {
                    showAlert({
                        title: translate('firmware.changeLanguage.failure.title'),
                        description: translate('firmware.changeLanguage.failure.description'),
                        primaryButtonTitle: translate('generic.buttons.gotIt'),
                        primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                        onPressPrimaryButton: navigation.goBack,
                    });
                }
            }
        },
        [navigation, showToast, showAlert, translate],
    );

    return { changeFirmwareLanguage };
};
