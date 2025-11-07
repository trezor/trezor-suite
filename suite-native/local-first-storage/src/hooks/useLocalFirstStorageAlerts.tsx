import { useSelector } from 'react-redux';

import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { useLocalFirstStorage } from '@suite-common/local-first-storage';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

export const useLocalFirstStorageAlerts = () => {
    const { showAlert } = useAlert();

    const device = useSelector(selectSelectedDevice);

    const { disableLocalFirstStorageIfNeeded, enableLocalFirstStorageIfNeeded } =
        useLocalFirstStorage({
            device,
        });

    const showLocalFirstStorageDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="labeling.disableAlert.title" />,
            description: <Translation id="labeling.disableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.disableAlert.cta" />,
            onPressPrimaryButton: disableLocalFirstStorageIfNeeded,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const showLocalFirstStorageEnableConfirmationAlert = (onSuccess: () => void) => {
        showAlert({
            title: <Translation id="labeling.enableAlert.title" />,
            description: <Translation id="labeling.enableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.enableAlert.cta" />,
            onPressPrimaryButton: () => {
                enableLocalFirstStorageIfNeeded(evoluReactNativeDeps);
                onSuccess();
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    return {
        showLocalFirstStorageDisableConfirmationAlert,
        showLocalFirstStorageEnableConfirmationAlert,
    };
};
