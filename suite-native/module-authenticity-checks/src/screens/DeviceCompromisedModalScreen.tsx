import { type RouteProp, useRoute } from '@react-navigation/native';

import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { DeviceAuthenticityCheckFailModalContent } from '../components/DeviceAuthenticityCheckFailModalContent';
import { DeviceIdCheckFailModalContent } from '../components/DeviceIdCheckFailModalContent';
import { DeviceInvariabilityCheckFailModalContent } from '../components/DeviceInvariabilityCheckFailModalContent';
import { EntropyCheckFailModalContent } from '../components/EntropyCheckFailModalContent';
import { FirmwareAuthenticityCheckFailModalContent } from '../components/FirmwareAuthenticityCheckFailModalContent';
import { useCloseDeviceCompromisedScreen } from '../components/useCloseDeviceCompromisedScreen';

/**
 * Modal can be displayed for:
 * - entropy check failure
 * - FW authenticity check failure
 * - device authenticity check failure
 * - device meta checks failure (id, invariability)
 */
export const DeviceCompromisedModalScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.DeviceCompromisedModal>>();
    const { failedCheck } = route.params;
    const { handleClose } = useCloseDeviceCompromisedScreen();

    if (!failedCheck) {
        console.error('DeviceCompromisedModalScreen requires failedCheck param to be passed');
        handleClose();

        return null;
    }

    switch (failedCheck) {
        case 'device-id':
            return <DeviceIdCheckFailModalContent />;
        case 'device-invariability':
            return <DeviceInvariabilityCheckFailModalContent />;
        case 'device-authenticity':
            return <DeviceAuthenticityCheckFailModalContent />;
        case 'entropy':
            return <EntropyCheckFailModalContent />;
        case 'firmware-authenticity':
            return <FirmwareAuthenticityCheckFailModalContent />;
        default:
            return exhaustive(failedCheck);
    }
};
