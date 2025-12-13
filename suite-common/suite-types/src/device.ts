import { DeviceMetadata } from '@suite-common/metadata-types';
import { EncryptedHex } from '@suite-common/platform-encryption';
import {
    DeviceButtonRequest,
    DeviceEvent,
    DeviceState,
    Features,
    KnownDevice,
    PROTO,
    StaticSessionId,
    UnknownDevice as UnknownDeviceBase,
    UnreadableDevice as UnreadableDeviceBase,
} from '@trezor/connect';
import { VersionArray } from '@trezor/device-utils';
import { Branded, UnionSubset } from '@trezor/type-utils';

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

/**
 * This is identifier of the SuiteSync user. We generate an Owner for every
 * wallet (seed+passphrase). It is deterministically derived from the secret
 * in Trezor Device (seed+passphrase).
 *
 * This can be calculated from SuiteSyncOwnerSecretHex.
 */
export type SuiteSyncOwnerId = string & Branded<SuiteSyncOwnerId>;
export const asSuiteSyncOwnerId = (value: string) => value as SuiteSyncOwnerId;

/**
 * This is an SLIP21 node, it is provided by Trezor Device
 * (derived from the wallets secret)
 */
export type SuiteSyncOwnerSecretHex = string & Branded<SuiteSyncOwnerSecretHex>;
export const asSuiteSyncOwnerSecretHex = (value: string) => value as SuiteSyncOwnerSecretHex;

export type SuiteSyncOwner = {
    ownerId: SuiteSyncOwnerId;
    ownerSecret: SuiteSyncOwnerSecretHex;
};

/**
 * JSON.stringify(SuiteSyncOwner)
 */
export type SuiteSyncOwnerSerialized = string & Branded<'SuiteSyncOwnerSerialized'>;
export const serializeSuiteSyncOwner = (value: SuiteSyncOwner) =>
    JSON.stringify(value) as SuiteSyncOwnerSerialized;
export const deserializeSuiteSyncOwner = (value: SuiteSyncOwnerSerialized) =>
    JSON.parse(value) as SuiteSyncOwner;

/**
 * Private Key that is unique to the Device. It is created when it
 * is requested for the first time (so it is not known beforehand).
 * It is used as a "hot" key for Suite, where device delegates
 * some signing capabilities to the Suite (for example the Suite Sync).
 */
export type DelegatedIdentityKey = string & Branded<'DelegatedIdentityKey'>; // hex-encoded P-256 private key string
export const asDelegatedIdentityKey = (
    privateKey: Uint8Array<ArrayBufferLike> | string,
): DelegatedIdentityKey => String(privateKey) as DelegatedIdentityKey;

export interface ExtendedDevice {
    useEmptyPassphrase?: boolean;
    remember?: boolean; // device should be remembered
    temporaryRemember?: boolean; // device should be remembered only for fw update or this session
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    discovered?: boolean;

    instance?: number;
    ts: number;
    firstConnectedTimestamp: number;
    buttonRequests: ButtonRequest[];
    metadata: DeviceMetadata;
    suiteSyncOwner: EncryptedHex<SuiteSyncOwnerSerialized> | null;
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

type PersistedDeviceKey = UnionSubset<keyof AcquiredDevice, 'thp' | 'bluetoothProps'>;

type PersistedFeatureKey = UnionSubset<
    keyof Features,
    | 'device_id'
    | 'internal_model'
    | 'fw_vendor'
    | 'revision'
    | 'unit_color'
    | 'label'
    | 'initialized'
>;

export type PersistentDeviceData = Pick<AcquiredDevice, PersistedDeviceKey> &
    Pick<Features, PersistedFeatureKey> & {
        firmwareVersion: VersionArray | null;
        lastConnectedVia: 'bluetooth' | 'usb' | null;
        lastEntropyCheckResult?: { success: boolean };
        delegatedIdentityKey: EncryptedHex<DelegatedIdentityKey> | null;
        // TODO move deviceAuthenticity to this object and newly introduce persistence
    };

export type TrezorDeviceWithState = AcquiredDevice & {
    id: string;
    state: NonNullable<AcquiredDevice['state']> & { staticSessionId: StaticSessionId };
};
