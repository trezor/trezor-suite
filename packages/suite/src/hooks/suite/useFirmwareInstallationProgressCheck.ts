import { useState } from 'react';

import * as semver from 'semver';

import { TrezorDevice } from '@suite-common/suite-types';
import { UI } from '@trezor/connect';
import { DeviceModelInternal, getFirmwareVersion } from '@trezor/device-utils';

import { useFirmwareDesktopUpdate } from './useFirmwareDesktopUpdate';

// because the UI is targeted to a specific bootloader screen, we can only reliably target FW versions that share the same bootloader (the 1.12.1)
const MIN_T1B1_FW_VERSION = '1.12.1';
const MAX_T1B1_FW_VERSION = '1.13.1';

/**
 * This check is currently targeted only for T1B1 devices, and only for specific versions
 */
const getCheckSupport = (device?: TrezorDevice): boolean => {
    const isT1B1 = device?.features?.internal_model === DeviceModelInternal.T1B1;
    const deviceFWVersion = getFirmwareVersion(device);
    if (semver.valid(deviceFWVersion) === null) return false;

    return (
        isT1B1 &&
        semver.gte(deviceFWVersion, MIN_T1B1_FW_VERSION) &&
        semver.lt(deviceFWVersion, MAX_T1B1_FW_VERSION)
    );
};

export const useFirmwareInstallationProgressCheck = () => {
    const { originalDevice, uiEvent } = useFirmwareDesktopUpdate();
    const isCheckSupported = getCheckSupport(originalDevice);
    const isUnexpectedDelay = uiEvent?.type === UI.FIRMWARE_PROGRESS_UNEXPECTED_DELAY;

    const [isDismissed, setIsDismissed] = useState(false);
    const handleDismissProgressCheck = () => setIsDismissed(true);

    const isProgressCheckDisplayed = isCheckSupported && isUnexpectedDelay && !isDismissed;

    return {
        isProgressCheckDisplayed,
        handleDismissProgressCheck,
    };
};
