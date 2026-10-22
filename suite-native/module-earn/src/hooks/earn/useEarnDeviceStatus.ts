import { useSelector } from 'react-redux';

import { getEarnDeviceStatus } from '@suite-common/analytics';
import { selectDeviceButtonRequests, selectSelectedDevice } from '@suite-common/device';
import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';

export const useEarnDeviceStatus = () => {
    const device = useSelector(selectSelectedDevice);
    const authorizationStep = useSelector(selectDeviceAuthorizationStep);
    const buttonRequests = useSelector(selectDeviceButtonRequests);
    const lastRequest = buttonRequests.at(-1);

    return getEarnDeviceStatus(device, {
        isPinRequested:
            authorizationStep === DeviceAuthorizationStep.PinRequested ||
            lastRequest?.code === 'ButtonRequest_PinEntry' ||
            lastRequest?.code === 'PinMatrixRequestType_Current',
        isPassphraseRequested:
            authorizationStep === DeviceAuthorizationStep.PassphraseRequested ||
            lastRequest?.code === 'ButtonRequest_PassphraseEntry' ||
            (lastRequest?.code === 'ButtonRequest_Other' &&
                lastRequest.name === 'passphrase_host1'),
    });
};
