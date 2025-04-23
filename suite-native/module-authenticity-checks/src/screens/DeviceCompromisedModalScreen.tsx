import { useSelector } from 'react-redux';

import { selectIsEntropyCheckEnabledAndFailed } from '@suite-native/device';

import { EntropyCheckFailModalContent } from '../components/EntropyCheckFailModalContent';
import { FirmwareAuthenticityCheckFailModalContent } from '../components/FirmwareAuthenticityCheckFailModalContent';

/**
 * The very similar modal can be displayed for entropy check failure or FW authenticity check failure
 */
export const DeviceCompromisedModalScreen = () => {
    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);

    return isEntropyCheckEnabledAndFailed ? (
        <EntropyCheckFailModalContent />
    ) : (
        <FirmwareAuthenticityCheckFailModalContent />
    );
};
