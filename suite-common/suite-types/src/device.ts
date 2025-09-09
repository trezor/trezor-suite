import { DeviceMetadata } from '@suite-common/metadata-types';
import {
    DeviceButtonRequest,
    DeviceEvent,
    DeviceState,
    KnownDevice,
    PROTO,
    UnknownDevice as UnknownDeviceBase,
    UnreadableDevice as UnreadableDeviceBase,
} from '@trezor/connect';
import { Branded } from '@trezor/type-utils';

// Extend original ButtonRequestMessage from @trezor/connect
// suite (deviceReducer) stores them in slightly different shape:
// - device field from @trezor/connect is excluded
// - code field (ButtonRequestType) is extended/combined with PinMatrixRequestType and WordRequestType (from DeviceMessage)
// - code field also uses two custom ButtonRequests - 'ui-request_pin' and 'ui-invalid_pin' (TODO: it shouldn't)

// TODO: Suite should not define its own type for ButtonRequest. There should be
// sufficient type exported from @trezor/connect;

export type ButtonRequest = Omit<DeviceEvent['payload'], 'device' | 'code'> & {
    code?:
        | 'ui-request_pin'
        | 'ui-invalid_pin'
        | DeviceButtonRequest['payload']['code']
        | NonNullable<PROTO.PinMatrixRequest>['type'];
};

export type DeviceEvoluOwnerId = string & Branded<DeviceEvoluOwnerId>;
export const asDeviceEvoluOwnerId = (value: string) => value as DeviceEvoluOwnerId;

export type EvoluKeys = {
    ownerId: DeviceEvoluOwnerId;
    writeKey: string;
    encryptionKey: string;
};

export interface ExtendedDevice {
    useEmptyPassphrase?: boolean;
    remember?: boolean; // device should be remembered
    forceRemember?: true; // device was forced to be remembered
    temporaryRemember?: boolean; // device should be remembered only for fw update or this session
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    discovered?: boolean;

    instance?: number;
    ts: number;
    firstConnectedTimestamp: number;
    buttonRequests: ButtonRequest[];
    metadata: DeviceMetadata;
    localFirstStorageSecret?: {
        isRetrieving: boolean; // To prevent consequential call of the TrezorConnect.evoluGetNode(...)
        evoluKeys: EvoluKeys | undefined;
    };
    walletNumber?: number; // number of passphrase wallet intended to be used in UI
    passwords: DeviceMetadata;
    reconnectRequested?: boolean; // currently only after wipeDevice

    // note: store the state using the new object format, not the state string
    // this can be removed once the state string is removed from Connect
    state?: DeviceState;
}

export type AcquiredDevice = Omit<KnownDevice, 'state' | '_state'> & ExtendedDevice;

export type UnknownDevice = UnknownDeviceBase & ExtendedDevice;

export type UnreadableDevice = UnreadableDeviceBase & ExtendedDevice;

export type TrezorDevice = AcquiredDevice | UnknownDevice | UnreadableDevice;

export type AuthorizedDevice = AcquiredDevice & {
    useEmptyPassphrase: boolean;
    state: Required<DeviceState>;
    instance: number;
    walletNumber: number;
};

/**
 * used when saving device to storage
 */
export type DeviceWithEmptyPath = Omit<AcquiredDevice, 'path'> & { path: '' };
