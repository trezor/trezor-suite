import { useSelector } from 'react-redux';

import {
    selectCompromisedDeviceFailedCheck,
    selectIsDeviceCompromised,
    selectIsEntropyCheckEnabledAndFailed,
} from '../selectors';

export const useDeviceChecks = (isDeviceCompromisedModalFocused: boolean) => {
    const compromisedDeviceFailedCheck = useSelector(selectCompromisedDeviceFailedCheck);
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    // but the DeviceCompromisedModal shall not be persistent for Entropy check, because you cannot exit the modal via normal means
    const shouldKeepDeviceCompromisedModal =
        isDeviceCompromisedModalFocused && !isEntropyCheckEnabledAndFailed;

    return {
        shouldNavigateToDeviceCompromisedModal: isDeviceCompromised,
        // any failing check should navigate to the DeviceCompromisedModal
        shouldKeepDeviceCompromisedModal,
        failedCheck: compromisedDeviceFailedCheck,
    };
};
