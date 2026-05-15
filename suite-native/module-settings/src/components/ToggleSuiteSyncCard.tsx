import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { useAlert } from '@suite-native/alerts';
import { type NativeAnalyticsDep, events as nativeEvents } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { StorageContext } from '@suite-native/storage';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';

export const ToggleSuiteSyncCard = () => {
    const { analytics } = useServices<NativeAnalyticsDep>();
    const persistor = useContext(StorageContext);
    const { showAlert } = useAlert();
    const { suiteSync } = useServices<SuiteSyncDep>();
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();
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
            const result = await suiteSync.turnOnSuiteSync({
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
