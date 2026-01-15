import { useSelector } from 'react-redux';

import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { useAlert } from '@suite-native/alerts';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

export const ToggleLabelingCard = () => {
    const { showAlert } = useAlert();
    const { showToast } = useToast();
    const { suiteSync } = useNativeServices();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="suiteSync.disableAlert.title" />,
            description: <Translation id="suiteSync.disableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.disableAlert.cta" />,
            onPressPrimaryButton: suiteSync.turnOffSuiteSync,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const toggleSuiteSync = () => {
        if (isSuiteSyncEnabled) {
            showSuiteSyncDisableConfirmationAlert();
        } else {
            suiteSync.turnOnSuiteSync({
                onError: ({ error }) => {
                    const { type } = error;
                    switch (type) {
                        case 'SuiteSyncUnavailableOnDeviceError':
                        case 'DeviceCancelled':
                        case 'DeviceError':
                            showToast({ variant: 'error', icon: 'warning', message: type });

                            return;
                        default:
                            return exhaustive(type);
                    }
                },
            });
        }
    };

    return (
        <>
            <TouchableSwitchRow
                icon="arrowsClockwise"
                isChecked={isSuiteSyncEnabled}
                onChange={toggleSuiteSync}
                text={<Translation id="moduleSettings.items.features.suiteSync.title" />}
                description={
                    <Translation id="moduleSettings.items.features.suiteSync.toggleDescription" />
                }
                accessibilityLabel="Secure sync toggle"
                testID="settings/secure-sync-touchable-row"
            />
        </>
    );
};
