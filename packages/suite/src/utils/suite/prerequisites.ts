import { isAdditionalShamirBackupInProgress, isRecoveryInProgress } from '@suite/recovery';

import { RouterState } from 'src/reducers/suite/routerReducer';
import type { TransportState } from 'src/reducers/suite/suiteReducer';
import type { AppState, TrezorDevice } from 'src/types/suite';

type GetPrerequisiteNameParams = {
    router: AppState['router'];
    device?: TrezorDevice;
    transport?: TransportState;
};

export const prerequisiteTypes = [
    'no-transport',
    'device-disconnected',
    'device-disconnect-required',
    'device-used-elsewhere',
    'device-thp-locked',
    'device-unacquired',
    'device-unreadable',
    'device-unknown',
    'device-seedless',
    'device-recovery-mode',
    'multi-share-backup-in-progress',
    'device-initialize',
    'device-bootloader',
    'firmware-missing',
    'firmware-required',
    'firmware-corrupted',
    'device-busy',
    'device-rebooting',
    'device-bootloader-locked',
    'device-hard-locked',
] as const;

export type PrerequisiteType = (typeof prerequisiteTypes)[number];

export const getPrerequisiteName = ({
    router,
    device,
    transport,
}: GetPrerequisiteNameParams): PrerequisiteType | null => {
    if (!router || router.app === 'unknown') return null;

    // no transport available
    if (transport && !transport.transports.length) return 'no-transport';

    if (!device) return 'device-disconnected';

    if (device.reconnectRequested) {
        return 'device-disconnect-required';
    }

    if (device.type === 'unacquired' && device?.transportSessionOwner)
        return 'device-used-elsewhere';

    if (device.status === 'busy') return 'device-busy';
    if (device.status === 'rebooting') return 'device-rebooting';
    if (device.status === 'bootloader-locked') return 'device-bootloader-locked';
    if (device.status === 'hard-locked') return 'device-hard-locked';

    // Unacquired device with Trezor Host Protocol properties means
    // that the user must perform the Trezor Host Protocol paring
    if (device.status === 'thp-locked') {
        return !device.features ? 'device-thp-locked' : null;
    }

    // device features cannot be read, device is probably used in another window
    if (device.type === 'unacquired') return 'device-unacquired';

    // Webusb unreadable device (HID)
    if (device.type === 'unreadable') return 'device-unreadable';

    // device features unknown (this shouldn't happen tho)
    if (!device.features) return 'device-unknown';

    // device in seedless mode, check it before checking firmware
    // fw may be outdated but it should not be updated by suite
    if (device.mode === 'seedless') return 'device-seedless';

    // similar to initialize, there is no seed in device
    // difference is it is in recovery mode.
    // todo: this could be added to @trezor/connect to device.mode I think.
    if (isRecoveryInProgress(device.features)) {
        return 'device-recovery-mode';
    }

    if (isAdditionalShamirBackupInProgress(device.features)) {
        return 'multi-share-backup-in-progress';
    }

    // device is not initialized
    // todo: should not happen and redirect to onboarding instead?
    if (device.mode === 'initialize') return 'device-initialize';

    // device is in bootloader mode
    if (device.mode === 'bootloader') {
        if (device.features.firmware_corrupted) {
            return 'firmware-corrupted';
        }

        return device.features.firmware_present ? 'device-bootloader' : 'firmware-missing';
    }

    // device firmware update required
    if (device.firmware === 'required') return 'firmware-required';

    return null;
};

const settingsAppActivePrerequisites: PrerequisiteType[] = ['device-disconnect-required'];

type IsPrerequisiteExcluded = {
    router: RouterState;
    prerequisite: PrerequisiteType | null;
};

/**
 * Check if the prerequisite should be ignored in whole suite.
 * Note that fullscreen apps may ignore another prerequisites, e.g. 'start'.
 * TODO: remove the fullscreenApp logic, see Preloader
 */
export const isPrerequisiteGloballyExcluded = ({
    router,
    prerequisite,
}: IsPrerequisiteExcluded): boolean => {
    if (prerequisite === null) return true;
    if (router.app === 'settings') {
        return !settingsAppActivePrerequisites.includes(prerequisite);
    }

    return false;
};
