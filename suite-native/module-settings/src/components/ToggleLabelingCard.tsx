import { useSelector } from 'react-redux';

import { selectIsSuiteSyncEnabled, useToggleSuiteSyncMethods } from '@suite-common/suite-sync';
import { useAlert } from '@suite-native/alerts';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ToggleLabelingCard = () => {
    const { showAlert } = useAlert();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const { enableSuiteSyncIfNeeded, disableSuiteSyncIfNeeded } = useToggleSuiteSyncMethods();

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="labeling.disableAlert.title" />,
            description: <Translation id="labeling.disableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.disableAlert.cta" />,
            onPressPrimaryButton: disableSuiteSyncIfNeeded,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

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
