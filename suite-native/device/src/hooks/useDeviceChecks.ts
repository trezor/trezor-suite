import { useSelector } from 'react-redux';

import { selectIsFirmwareAuthenticityCheckDismissed } from '@suite-common/wallet-core';
import { selectIsOnboardingFinished } from '@suite-native/settings';

import {
    selectHasFirmwareAuthenticityCheckHardFailed,
    selectIsDeviceAuthenticityCheckFailed,
    selectIsEntropyCheckEnabledAndFailed,
} from '../selectors';

export const useDeviceChecks = (isDeviceCompromisedModalFocused: boolean) => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    const isFirmwareAuthenticityCheckDismissed = useSelector(
        selectIsFirmwareAuthenticityCheckDismissed,
    );
    const isDeviceAuthenticityCheckFailed = useSelector(selectIsDeviceAuthenticityCheckFailed);
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);

    const isFirmwareAuthenticityCheckHardFailedAndNotDismissed =
        hasFirmwareAuthenticityCheckHardFailed && !isFirmwareAuthenticityCheckDismissed;

    // any failing check should navigate to the DeviceCompromisedModal
    const shouldNavigateToDeviceCompromisedModal =
        isOnboardingFinished &&
        (isDeviceAuthenticityCheckFailed ||
            isEntropyCheckEnabledAndFailed ||
            isFirmwareAuthenticityCheckHardFailedAndNotDismissed);

    // but the DeviceCompromisedModal shall not be persistent for Entropy check, because you cannot exit the modal via normal means
    const shouldKeepDeviceCompromisedModal =
        isDeviceCompromisedModalFocused && !isEntropyCheckEnabledAndFailed;

    const getFailedCheck = (): 'device-authenticity' | 'entropy' | 'firmware-authenticity' => {
        if (isDeviceAuthenticityCheckFailed) {
            return 'device-authenticity';
        }
        if (isEntropyCheckEnabledAndFailed) {
            return 'entropy';
        }

        return 'firmware-authenticity';
    };

    const failedCheck = getFailedCheck();

    return {
        shouldNavigateToDeviceCompromisedModal,
        shouldKeepDeviceCompromisedModal,
        failedCheck,
    };
};
