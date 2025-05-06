import { useSelector } from 'react-redux';

import {
    selectIsDeviceAuthenticityCheckFailed,
    selectIsEntropyCheckEnabledAndFailed,
} from '@suite-native/device';

import { DeviceAuthenticityCheckFailModalContent } from '../components/DeviceAuthenticityCheckFailModalContent';
import { EntropyCheckFailModalContent } from '../components/EntropyCheckFailModalContent';
import { FirmwareAuthenticityCheckFailModalContent } from '../components/FirmwareAuthenticityCheckFailModalContent';

/**
 * Modal can be displayed for:
 * - entropy check failure
 * - FW authenticity check failure
 * - device authenticity check failure
 */
export const DeviceCompromisedModalScreen = () => {
    const isDeviceAuthenticityCheckFailed = useSelector(selectIsDeviceAuthenticityCheckFailed);
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);

    if (isDeviceAuthenticityCheckFailed) {
        return <DeviceAuthenticityCheckFailModalContent />;
    }

    if (isEntropyCheckEnabledAndFailed) {
        return <EntropyCheckFailModalContent />;
    }

    return <FirmwareAuthenticityCheckFailModalContent />;
};
