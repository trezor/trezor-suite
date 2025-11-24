import { useSelector } from 'react-redux';

import { useSuiteSync } from '@suite-common/suite-sync';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

export const useSuiteSyncAlerts = () => {
    const { showAlert } = useAlert();

    const device = useSelector(selectSelectedDevice);

    const { disableSuiteSyncIfNeeded, enableSuiteSyncIfNeeded } = useSuiteSync({
        device,
    });

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="labeling.disableAlert.title" />,
            description: <Translation id="labeling.disableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.disableAlert.cta" />,
            onPressPrimaryButton: disableSuiteSyncIfNeeded,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const showSuiteSyncEnableConfirmationAlert = (onSuccess: () => void) => {
        showAlert({
            title: <Translation id="labeling.enableAlert.title" />,
            description: <Translation id="labeling.enableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.enableAlert.cta" />,
            onPressPrimaryButton: () => {
                enableSuiteSyncIfNeeded();
                onSuccess();
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    return {
        showSuiteSyncDisableConfirmationAlert,
        showSuiteSyncEnableConfirmationAlert,
    };
};
