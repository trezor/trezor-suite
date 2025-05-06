import { UnreachableCaseError } from '@suite-common/suite-utils';
import { RootStackParamList, RootStackRoutes, StackProps } from '@suite-native/navigation';

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
    const { failedCheck } = route.params;

    switch (failedCheck) {
        case 'device-authenticity':
            return <DeviceAuthenticityCheckFailModalContent />;
        case 'entropy':
            return <EntropyCheckFailModalContent />;
        case 'firmware-authenticity':
            return <FirmwareAuthenticityCheckFailModalContent />;
        default:
            throw new UnreachableCaseError(failedCheck);
    }
};
