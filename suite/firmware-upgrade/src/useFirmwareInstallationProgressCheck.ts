import { useState } from 'react';

import { UI_EVENTS } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useFirmwareDesktopUpdate } from './useFirmwareDesktopUpdate';

export const useFirmwareInstallationProgressCheck = () => {
    const { originalDevice, uiEvent } = useFirmwareDesktopUpdate();
    const isT1B1 = originalDevice?.features?.internal_model === DeviceModelInternal.T1B1;

    const isUnexpectedDelay = uiEvent?.type === UI_EVENTS.FIRMWARE_PROGRESS_UNEXPECTED_DELAY;

    const [isDismissed, setIsDismissed] = useState(false);
    const handleDismissProgressCheck = () => setIsDismissed(true);

    const isProgressCheckDisplayed = isT1B1 && isUnexpectedDelay && !isDismissed;

    return {
        isProgressCheckDisplayed,
        handleDismissProgressCheck,
    };
};
