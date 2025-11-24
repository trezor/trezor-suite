import { useSelector } from 'react-redux';

import { useSuiteSync } from '@suite-common/suite-sync';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useSuiteSyncAlerts } from '@suite-native/suite-sync';

export const ToggleLabelingCard = () => {
    const { showSuiteSyncDisableConfirmationAlert } = useSuiteSyncAlerts();
    const selectedDevice = useSelector(selectSelectedDevice);
    const { isSuiteSyncEnabled, enableSuiteSyncIfNeeded } = useSuiteSync({
        device: selectedDevice,
    });

    const toggleSuiteSync = () =>
        isSuiteSyncEnabled ? showSuiteSyncDisableConfirmationAlert() : enableSuiteSyncIfNeeded();

    return (
        <>
            <TouchableSwitchRow
                icon="arrowsClockwise"
                isChecked={isSuiteSyncEnabled}
                onChange={toggleSuiteSync}
                text={<Translation id="moduleSettings.secureSync.title" />}
                description={<Translation id="moduleSettings.secureSync.description" />}
                accessibilityLabel="Secure sync toggle"
                testID="settings/secure-sync-touchable-row"
            />
        </>
    );
};
