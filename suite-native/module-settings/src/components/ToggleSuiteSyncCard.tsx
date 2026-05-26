import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import {
    selectTurnOffSuiteSyncDep,
    selectTurnOnSuiteSyncDep,
} from '@suite-common/suite-sync-types';
import { useAlert } from '@suite-native/alerts';
import { events as nativeEvents, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { StorageContext } from '@suite-native/storage';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';

export const ToggleSuiteSyncCard = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const storageContext = useContext(StorageContext);
    const { showAlert } = useAlert();

    const { turnOffSuiteSync, turnOnSuiteSync } = useServices(
        selectTurnOffSuiteSyncDep,
        selectTurnOnSuiteSyncDep,
    );

    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const selectedDevice = useSelector(selectSelectedDevice);

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="suiteSync.disableAlert.title" />,
            description: <Translation id="suiteSync.disableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.disableAlert.cta" />,
            onPressPrimaryButton: () => {
                turnOffSuiteSync({
                    ensureSettingsPersisted: () => storageContext?.flush(),
                });

                analytics.report({
                    type: events.settingsGeneralLabelingEvent.name,
                    payload: {
                        value: 'off',
                    },
                });
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const toggleSuiteSync = async (value: boolean) => {
        if (isSuiteSyncEnabled) {
            showSuiteSyncDisableConfirmationAlert();
        } else {
            const result = await turnOnSuiteSync({
                deviceStaticSessionId: selectedDevice?.state?.staticSessionId,
            });

            analytics.report({
                type: events.settingsGeneralLabelingEvent.name,
                payload: {
                    value: 'suite-sync',
                },
            });

            if (!result.success) {
                handleSuiteSyncError(result.error);
            }
        }

        analytics.report({
            type: nativeEvents.settingsToggleExperimentalFeatureEvent.name,
            payload: { feature: 'suite-sync', value },
        });
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
