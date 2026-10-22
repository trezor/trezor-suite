import { useDevice } from '@suite/device';
import { MODAL_CONTEXT_DEVICE, selectModal } from '@suite/modal';
import { getEarnDeviceStatus } from '@suite-common/analytics';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

export const useEarnDeviceStatus = () => {
    const { device } = useDevice();
    const modal = useSelector(selectModal);
    const windowType = modal.context === MODAL_CONTEXT_DEVICE ? modal.windowType : undefined;

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
