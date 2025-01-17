import { useSelector } from 'react-redux';

import { selectFirmwareRevisionCheckErrorIfEnabled } from '@suite-native/device';

export const useIsFwRevisionCheckOfflineError = () => {
    const firmwareRevisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);

    return firmwareRevisionCheckError === 'cannot-perform-check-offline';
};
