import { useSelector } from 'react-redux';

import { selectIsEntropyCheckEnabledAndFailed } from '../selectors';

export const useDeviceChecks = (isDeviceCompromisedModalFocused: boolean) => {
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);

    // but the DeviceCompromisedModal shall not be persistent for Entropy check, because you cannot exit the modal via normal means
    const shouldKeepDeviceCompromisedModal =
        isDeviceCompromisedModalFocused && !isEntropyCheckEnabledAndFailed;

    return {
        // any failing check should navigate to the DeviceCompromisedModal
        shouldKeepDeviceCompromisedModal,
    };
};
