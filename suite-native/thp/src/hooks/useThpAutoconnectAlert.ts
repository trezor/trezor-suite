import { useCallback, useState } from 'react';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { useThpAutoconnectActions } from './useThpAutoconnectActions';

export const useThpAutoconnectAlert = () => {
    const [wasAlertShown, setWasAlertShown] = useState(false);
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const { startThpAutoconnect, ignoreThpAutoconnect } = useThpAutoconnectActions();

    const showEnableThpAutoconnectAlert = useCallback(() => {
        // Make sure the alert cannot accidentally reappear once dismissed.
        if (!wasAlertShown) {
            showAlert({
                title: translate('thp.autoconnect.title'),
                description: translate('thp.autoconnect.description'),
                primaryButtonTitle: translate('thp.autoconnect.turnOnButton'),
                onPressPrimaryButton: startThpAutoconnect,
                secondaryButtonTitle: translate('thp.autoconnect.noThanksButton'),
                onPressSecondaryButton: ignoreThpAutoconnect,
            });
            setWasAlertShown(true);
        }
    }, [wasAlertShown, showAlert, translate, startThpAutoconnect, ignoreThpAutoconnect]);

    return { showEnableThpAutoconnectAlert };
};
