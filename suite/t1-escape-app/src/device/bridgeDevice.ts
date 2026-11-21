import {
    DEVICE_TYPE,
    type Descriptor,
    type Session,
    TRANSPORT,
    type TransportDeviceEvent,
} from '@trezor/transport-common';
import { type VersionArray, versionUtils } from '@trezor/utils';

import type { DeviceLostReason } from './deviceSession';

/** Identifies this app as the owner of a bridge session. */
export const BRIDGE_TRANSPORT_ID = 'Trezor One migration';

/** First bridge version, shipped inside Trezor Suite, that can talk to HID devices. */
export const MIN_BRIDGE_VERSION: VersionArray = [3, 3, 0];

export const isBridgeVersionSupported = (version: string) => {
    const parsed = versionUtils.tryParse(version);

    return !!parsed && versionUtils.isNewerOrEqual(parsed, MIN_BRIDGE_VERSION);
};

export type DeviceSelection =
    | { type: 'none' }
    /** The old HID Trezor One this app is for. */
    | { type: 'legacy-trezor-one'; descriptor: Descriptor }
    /** Only newer Trezors are connected. They are handled by Trezor Suite. */
    | { type: 'other-trezor' }
    | { type: 'several-legacy-trezors' };

export const selectDevice = (descriptors: readonly Descriptor[]): DeviceSelection => {
    const legacyDescriptors = descriptors.filter(({ type }) => type === DEVICE_TYPE.TypeT1Hid);
    const [descriptor, ...others] = legacyDescriptors;

    if (!descriptor) return descriptors.length > 0 ? { type: 'other-trezor' } : { type: 'none' };
    if (others.length > 0) return { type: 'several-legacy-trezors' };

    return { type: 'legacy-trezor-one', descriptor };
};

/**
 * Reads a device event while this app holds `session`. A disconnect, or a session other than
 * ours, means the device can no longer be trusted to be showing what this app sent.
 */
export const getDeviceLostReason = (
    event: TransportDeviceEvent,
    session: Session,
): DeviceLostReason | undefined => {
    switch (event.type) {
        case TRANSPORT.DEVICE_DISCONNECTED:
            return 'disconnected';
        case TRANSPORT.DEVICE_SESSION_CHANGED:
            return event.descriptor.session === session ? undefined : 'session-taken';
        case TRANSPORT.DEVICE_REQUEST_RELEASE:
            return undefined;
        // no default
    }
};
