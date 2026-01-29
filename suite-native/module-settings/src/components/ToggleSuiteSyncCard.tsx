import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useLegacyAnalytics, useNativeServices } from '@suite-native/services';
import { StorageContext } from '@suite-native/storage';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

export const ToggleSuiteSyncCard = () => {
    const analytics = useLegacyAnalytics();
    const persistor = useContext(StorageContext);
    const { showAlert } = useAlert();
    const { showToast } = useToast();
    const { suiteSync } = useNativeServices();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const selectedDevice = useSelector(selectSelectedDevice);

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="suiteSync.disableAlert.title" />,
            description: <Translation id="suiteSync.disableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.disableAlert.cta" />,
            onPressPrimaryButton: () => {
                suiteSync.turnOffSuiteSync({
                    ensureSettingsPersisted: () => persistor?.flush(),
                });
                analytics.report({
                    type: 'settings/general/labeling',
                    payload: {
                        value: 'off',
                    },
                });
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const toggleSuiteSync = async () => {
        if (isSuiteSyncEnabled) {
            showSuiteSyncDisableConfirmationAlert();
        } else {
            const result = await suiteSync.turnOnSuiteSync({
                deviceStaticSessionId: selectedDevice?.state?.staticSessionId,
            });

            analytics.report({
                type: 'settings/general/labeling',
                payload: {
                    value: 'suite-sync',
                },
            });

            if (!result.success) {
                const { type } = result.error;
                switch (type) {
                    case 'SuiteSyncUnavailableOnDeviceError':
                    case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    case 'DeviceCancelled':
                    case 'DeviceError':
                        showToast({ variant: 'error', icon: 'warning', message: type });

                        return;

                    case 'WriteModeRequiredForAllocation':
                        // Do nothing, this is expected control flow error when we want allocate on-demand.
                        return;
                    default:
                        return exhaustive(type);
                }
            }
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
                testID="settings/suite-sync-touchable-row"
            />
        </>
    );
};
