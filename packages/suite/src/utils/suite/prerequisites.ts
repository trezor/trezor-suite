import type { TransportInfo } from 'trezor-connect';
import type { TrezorDevice, AppState } from '@suite-types';

interface PrerequisitesInput {
    router: AppState['router'];
    device?: TrezorDevice;
    transport?: Partial<TransportInfo>;
}

const getPrerequisiteName = ({ router, device, transport }: PrerequisitesInput) => {
    if (!router || router.app === 'unknown') return;

    // no transport available
    if (transport && !transport.type) return 'transport-bridge';

    if (!device) return 'device-disconnected';

    // device features cannot be read, device is probably used in another window
    if (device.type === 'unacquired') return 'device-unacquired';

    // Webusb unreadable device (HID)
    if (device.type === 'unreadable') return 'device-unreadable';

    // device features unknown (this shouldn't happened tho)
    if (!device.features) return 'device-unknown';

    // similar to initialize, there is no seed in device
    // difference is it is in recovery mode.
    // if (device.features.recovery_mode) return DeviceRecoveryMode;

    // device is not initialized
    // todo: should not happen and redirect to onboarding instead?
    if (device.mode === 'initialize') return 'device-initialize';

    // device is in bootloader mode
    if (device.mode === 'bootloader')
        return device.features.firmware_present ? 'device-bootloader' : 'firmware-missing';

    // device firmware update required
    if (device.firmware === 'required') return 'firmware-required';

    // device in seedless mode
    if (device.mode === 'seedless') return 'device-seedless';

    // account discovery in progress and didn't find any used account yet
    // const authConfirmation = getDiscoveryStatus();
    // if (authConfirmation?.type === 'auth-confirm') return DiscoveryLoader;
};

const getExcludedPrerequisites = (router: PrerequisitesInput['router']) => {
    if (router.app === 'onboarding') {
        return ['device-initialize'];
    }
    return [];
};

/**
 * Returns information about reason that is blocking user from interacting with Suite
 */
export const getPrerequisites = ({ router, device, transport }: PrerequisitesInput) => {
    const excluded = getExcludedPrerequisites(router);

    const prerequisite = getPrerequisiteName({ router, device, transport });

    if (typeof prerequisite === 'undefined') return;

    if (excluded.includes(prerequisite)) {
        return undefined;
    }

    return prerequisite;
};

// distributive conditional types to the rescue!
type DefinedUnionMember<T> = T extends string ? T : never;

export type PrerequisiteType = DefinedUnionMember<ReturnType<typeof getPrerequisites>>;
