import { useSelector } from 'react-redux';

import { useLocalFirstStorage } from '@suite-common/suite-sync';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useLocalFirstStorageAlerts } from '@suite-native/suite-sync';

export const ToggleLabelingCard = () => {
    const { showLocalFirstStorageDisableConfirmationAlert } = useLocalFirstStorageAlerts();
    const selectedDevice = useSelector(selectSelectedDevice);
    const { isLocalFirstStorageEnabled, enableLocalFirstStorageIfNeeded } = useLocalFirstStorage({
        device: selectedDevice,
    });

    const toggleLocalFirstStorage = () =>
        isLocalFirstStorageEnabled
            ? showLocalFirstStorageDisableConfirmationAlert()
            : enableLocalFirstStorageIfNeeded();

    return (
        <>
            <TouchableSwitchRow
                icon="arrowsClockwise"
                isChecked={isLocalFirstStorageEnabled}
                onChange={toggleLocalFirstStorage}
                text={<Translation id="moduleSettings.secureSync.title" />}
                description={<Translation id="moduleSettings.secureSync.description" />}
                accessibilityLabel="Secure sync toggle"
                testID="settings/secure-sync-touchable-row"
            />
        </>
    );
};
