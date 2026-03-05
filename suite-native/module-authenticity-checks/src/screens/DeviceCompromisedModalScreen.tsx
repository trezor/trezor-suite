import { useSelector } from 'react-redux';

import { selectCompromisedDeviceFailedCheck } from '@suite-native/device';
import { exhaustive } from '@trezor/type-utils';

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
    const failedCheck = useSelector(selectCompromisedDeviceFailedCheck);

    switch (failedCheck) {
        case 'device-authenticity':
            return <DeviceAuthenticityCheckFailModalContent />;
        case 'entropy':
            return <EntropyCheckFailModalContent />;
        case 'firmware-authenticity':
        case null: // TODO fix entropy check screen persistence after disconnecting the device
            return <FirmwareAuthenticityCheckFailModalContent />;
        default:
            return exhaustive(failedCheck);
    }
};
