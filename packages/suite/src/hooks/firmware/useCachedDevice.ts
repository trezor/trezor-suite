import { useState, useEffect } from 'react';
import { useFirmware } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';

/**
 * Device caching logic, should be equivalent to the one in suite/src/components/firmware/FirmwareInitial.tsx.
 * If verified, it can replace that one as well.
 */
export const useCachedDevice = (liveDevice?: TrezorDevice) => {
    const { status } = useFirmware();
    const [cachedDevice, setCachedDevice] = useState<TrezorDevice | undefined>(liveDevice);
    useEffect(() => {
        // When user choses to install a new firmware update we will ask him/her to reconnect a device in bootloader mode.
        // This prompt (to reconnect a device in bootloader mode) is shown in modal which is visually layer above the content.
        // We are caching the device in order to preserve the background content (screen with fw update offer) when user
        // disconnects the device and reconnects it in bl mode.
        // (Device in BL mode doesn't provide us all the details and we don't want any flickering o reacting in general while user is just following our instructions)
        if (
            ['initial', 'waiting-for-bootloader'].includes(status) &&
            liveDevice?.connected &&
            liveDevice?.mode !== 'bootloader' &&
            liveDevice.features
        ) {
            // we never store state of the device while it is in bootloader, we want just "normal" mode
            setCachedDevice(liveDevice);
        }
    }, [cachedDevice?.id, liveDevice, status]);

    return cachedDevice;
};
