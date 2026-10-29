import { useDevice } from '@suite/device';
import { selectDeviceContextWindowType } from '@suite/modal';
import { getEarnDeviceStatus } from '@suite-common/analytics';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

export const useEarnDeviceStatus = () => {
    const { device } = useDevice();
    const windowType = useSelector(selectDeviceContextWindowType);

    return getEarnDeviceStatus(device, {
        isPinRequested:
            windowType === UI_REQUESTS.REQUEST_PIN ||
            windowType === UI_EVENTS.PIN_INVALID ||
            windowType === 'ButtonRequest_PinEntry',
        isPassphraseRequested:
            windowType === UI_REQUESTS.REQUEST_PASSPHRASE ||
            windowType === UI_EVENTS.PASSPHRASE_ON_DEVICE ||
            windowType === 'ButtonRequest_PassphraseEntry',
    });
};
