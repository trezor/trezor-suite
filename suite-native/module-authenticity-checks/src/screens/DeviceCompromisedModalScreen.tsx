import { useSelector } from 'react-redux';

import { selectCompromisedDeviceFailedCheck } from '@suite-native/device';
import { RootStackParamList, RootStackRoutes, StackProps } from '@suite-native/navigation';
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
export const DeviceCompromisedModalScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.DeviceCompromisedModal>) => {
    const { onClose } = route.params;

    const failedCheck = useSelector(selectCompromisedDeviceFailedCheck);

    switch (failedCheck) {
        case 'device-authenticity':
            return <DeviceAuthenticityCheckFailModalContent />;
        case 'entropy':
            return <EntropyCheckFailModalContent />;
        case 'firmware-authenticity':
            return <FirmwareAuthenticityCheckFailModalContent onClose={onClose} />;
        default:
            return exhaustive(failedCheck);
    }
};
