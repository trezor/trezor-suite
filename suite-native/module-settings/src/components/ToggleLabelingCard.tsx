import { useSelector } from 'react-redux';

import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { useAlert } from '@suite-native/alerts';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';

export const ToggleLabelingCard = () => {
    const { showAlert } = useAlert();
    const { suiteSync } = useNativeServices();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const showSuiteSyncDisableConfirmationAlert = () => {
        showAlert({
            title: <Translation id="labeling.disableAlert.title" />,
            description: <Translation id="labeling.disableAlert.description" />,
            primaryButtonTitle: <Translation id="labeling.disableAlert.cta" />,
            onPressPrimaryButton: suiteSync.turnOffSuiteSync,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const toggleSuiteSync = () => {
        if (isSuiteSyncEnabled) {
            showSuiteSyncDisableConfirmationAlert();
        } else {
            suiteSync.turnOnSuiteSync();
        }
    };

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
