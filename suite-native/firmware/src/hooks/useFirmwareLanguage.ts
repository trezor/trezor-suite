import { useCallback } from 'react';

import { LANGUAGES, Locale } from '@suite-common/suite-types';
import { useAlert } from '@suite-native/alerts';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

type FirmwareLanguageProps = {
    onCompletion: () => void;
};

export const useFirmwareLanguage = ({ onCompletion }: FirmwareLanguageProps) => {
    const { showToast } = useToast();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const changeFirmwareLanguage = useCallback(
        async (language: Locale) => {
            const result = await requestPrioritizedDeviceAccess({
                deviceCallback: () => TrezorConnect.changeLanguage({ language }),
            });

            if (!result.success) {
                return;
            }

            const { success, payload } = result.payload;
            if (success) {
                showToast({
                    variant: 'default',
                    message: translate('firmware.changeLanguage.success', {
                        languageName: LANGUAGES[language].name,
                    }),
                });
                onCompletion();
            } else {
                const errorCode = payload.code;
                if (
                    errorCode === 'Failure_ActionCancelled' ||
                    errorCode === 'Failure_PinCancelled' ||
                    errorCode === 'Method_Interrupted'
                ) {
                    onCompletion();
                } else {
                    showAlert({
                        title: translate('firmware.changeLanguage.failure.title'),
                        description: translate('firmware.changeLanguage.failure.description'),
                        primaryButtonTitle: translate('generic.buttons.gotIt'),
                        primaryButtonVariant: 'redBold',
                        onPressPrimaryButton: onCompletion,
                    });
                }
            }
        },
        [showToast, showAlert, translate, onCompletion],
    );

    return { changeFirmwareLanguage };
};
