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
    // todo: is transport-bridge good name? other prerequisites denote to the problem. this ones denotes to the solution
    if (transport && !transport.type) return 'transport-bridge';

    if (!device) return 'device-disconnected';

    // device features cannot be read, device is probably used in another window
    if (device.type === 'unacquired') return 'device-unacquired';

    // Webusb unreadable device (HID)
    if (device.type === 'unreadable') return 'device-unreadable';

    // device features unknown (this shouldn't happened tho)
    if (!device.features) return 'device-unknown';

    // device in seedless mode, check it before checking firmware
    // fw may be outdated but it should not be updated by suite
    if (device.mode === 'seedless') return 'device-seedless';

    // similar to initialize, there is no seed in device
    // difference is it is in recovery mode.
    // todo: this could be added to trezor-connect to device.mode I think.
    if (device.features.recovery_mode) return 'device-recovery-mode';

    // device is not initialized
    // todo: should not happen and redirect to onboarding instead?
    if (device.mode === 'initialize') return 'device-initialize';

    // device is in bootloader mode
    if (device.mode === 'bootloader')
        return device.features.firmware_present ? 'device-bootloader' : 'firmware-missing';

    // device firmware update required
    if (device.firmware === 'required') return 'firmware-required';
};

const getExcludedPrerequisites = (router: PrerequisitesInput['router']): PrerequisiteType[] => {
    if (router.app === 'settings') {
        return [
            'transport-bridge',
            'device-disconnected',
            'device-unacquired',
            'device-unreadable',
            'device-unknown',
            'device-seedless',
            'device-recovery-mode',
            'device-initialize',
            'device-bootloader',
            'firmware-missing',
            'firmware-required',
        ];
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

// distributive conditional types to the rescue! This way we can infer union literal type from ReturnType but exclude undefined
type DefinedUnionMember<T> = T extends string ? T : never;

export type PrerequisiteType = DefinedUnionMember<ReturnType<typeof getPrerequisiteName>>;
