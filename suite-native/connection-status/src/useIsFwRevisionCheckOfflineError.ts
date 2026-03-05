import { useSelector } from 'react-redux';

import { revisionCheckErrorScenarios } from '@suite-common/firmware-authenticity';
import { selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled } from '@suite-native/device';

export const useIsFwRevisionCheckOfflineError = () => {
    const firmwareRevisionCheckError = useSelector(
        selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled,
    );

    return (
        firmwareRevisionCheckError === 'cannot-perform-check-offline' &&
        // if TS throws error, it means that the aforementioned logic is no longer valid, and it should be reworked
        revisionCheckErrorScenarios[firmwareRevisionCheckError].type === 'softWarning'
    );
};
