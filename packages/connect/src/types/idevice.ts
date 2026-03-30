import type {
    Device,
    DeviceBusyStatus,
    DeviceButtonRequestPayload,
    DeviceFirmwareStatus,
    DeviceState,
    DeviceThpCredentialsChangedPayload,
    DeviceThpPairingPayload,
    DeviceThpPairingStatus,
    DeviceUniquePath,
    DeviceVersionChanged,
    Features,
    FirmwareHashCheckResult,
    KnownDevice,
    UiResponsePassphrase,
    UiResponsePin,
    UiResponseThpPairingTag,
    UiResponseWord,
    UnavailableCapabilities,
} from '@trezor/connect-common';
import type { FirmwareReleaseConfigInfo } from '@trezor/connect-common/src/types/firmware';
import type { FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type {
    DecodedTrezorPushNotification,
    TransportProtocol,
    thp as protocolThp,
} from '@trezor/protocol';
import type { Descriptor, Transport } from '@trezor/transport';
import type { TypedEmitter, VersionArray } from '@trezor/utils';

import type { TypedCallProvider } from './typed-call-provider';
import type { DeviceCommands } from '../device/DeviceCommands';

/**
 * Events emitted on the `device.lifecycle` emitter (separate from the main device TypedEmitter).
 * Defined here with string literals (matching the DEVICE constants) so that `IDevice` can be
 * declared in types/ without importing from the events module.
 *
 * These string values MUST match the corresponding `DEVICE.*` constants in `events/device.ts`.
 * We cannot import those constants here because events/device.ts imports from types/device.ts,
 * which would create a circular dependency.
 */
export interface DeviceLifecycleEvents {
    'device-connect': void;
    'device-connect_unacquired': void;
    'device-changed': void;
    'device-disconnect': void;
    'device-trezor_push_notification': DecodedTrezorPushNotification;
}

/**
 * Result type for device prompt callbacks.
 */
export type PromptResult<T> = { success: true; payload: T } | { success: false; error: Error };

/**
 * Events emitted on the main device TypedEmitter (not the lifecycle emitter).
 *
 * String literal keys MUST match the corresponding `DEVICE.*` constants in `events/device.ts`.
 * Defined here so that `IDevice.emit` / `IDevice.prompt` can be typed without importing
 * from the device/Device.ts module, which would create circular dependencies.
 */
export interface DeviceEvents {
    pin: {
        type: PROTO.PinMatrixRequestType | undefined;
        callback: (response: PromptResult<UiResponsePin['payload']>) => void;
    };
    word: {
        type: PROTO.WordRequestType;
        callback: (response: PromptResult<UiResponseWord['payload']>) => void;
    };
    passphrase: {
        callback: (response: PromptResult<UiResponsePassphrase['payload']>) => void;
    };
    passphrase_on_device: void;
    button: { device: IDevice; payload: DeviceButtonRequestPayload };
    'device-firmware_version_changed': DeviceVersionChanged['payload'];
    'device-trezor_push_notification': {
        device: Device;
        payload: DecodedTrezorPushNotification;
    };
    thp_pairing: {
        payload: DeviceThpPairingPayload;
        callback: (response: PromptResult<UiResponseThpPairingTag['payload']>) => void;
    };
    'device-thp_credentials_changed': DeviceThpCredentialsChangedPayload;
    'device-thp_pairing_status_changed': DeviceThpPairingStatus;
}

/**
 * Options accepted by `Device.run()`.
 * Exposed here so that `IDevice` can reference them without importing from device/Device.ts.
 */
export type RunOptions = {
    skipFinalReload?: boolean;
    keepSession?: boolean;
    useCardanoDerivation?: boolean;
    skipFirmwareChecks?: boolean;
    skipLanguageChecks?: boolean;
};

/**
 * Full public interface of the Device class.
 *
 * Placing it here (in types/) rather than in device/Device.ts means that files in the events/
 * module can import it as a type without pulling in the Device class implementation and its large
 * dependency tree, which would otherwise create circular imports.
 *
 * The Device class declares `implements IDevice` to ensure the two never drift apart.
 *
 * Note: `getCommands()` is intentionally omitted from this interface because its return type
 * (the result of the `DeviceCommands` factory) would require importing from device/DeviceCommands.ts
 * which chains back through the events module, re-creating the circular dependency we are avoiding.
 */
export interface IDevice {
    // ─── Identity / path ────────────────────────────────────────────────────────
    readonly transport: Transport;
    readonly descriptor: Pick<Descriptor, 'apiType' | 'id' | 'type' | 'path' | 'model'>;
    readonly protocol: TransportProtocol;
    readonly transportPath: Descriptor['path'];
    readonly lifecycle: TypedEmitter<DeviceLifecycleEvents>;
    readonly possibleT1: boolean;

    // ─── State ──────────────────────────────────────────────────────────────────
    readonly firmwareStatus: DeviceFirmwareStatus;
    readonly currentRelease: FirmwareRelease | undefined;
    readonly firmwareReleaseConfigInfo: FirmwareReleaseConfigInfo | undefined;
    readonly features: Features;
    readonly unavailableCapabilities: Readonly<UnavailableCapabilities>;
    readonly firmwareType: FirmwareType | undefined;

    // ─── Session control ────────────────────────────────────────────────────────
    readonly currentRun: Promise<void> | undefined;
    acquire(): ReturnType<Transport['acquire']>;
    release(): ReturnType<Transport['release']> | undefined;
    run(fn?: () => Promise<void>, options?: RunOptions): Promise<void>;
    interrupt(reason: Error): Promise<void>;
    reset(): void;
    setBusy(value?: DeviceBusyStatus): void;
    setupThp(): void;
    handshake(): Promise<boolean>;
    setInstance(instance?: number): void;

    // ─── Feature / state accessors ──────────────────────────────────────────────
    getThpState(): protocolThp.ThpState | undefined;
    getUniquePath(): DeviceUniquePath;
    getInstance(): number;
    getState(): DeviceState | undefined;
    setState(state?: Partial<DeviceState>): void;
    getVersion(): VersionArray | undefined;
    getBusy(): DeviceBusyStatus | undefined;
    getAuthenticityChecks(): KnownDevice['authenticityChecks'];
    setAuthenticityChecks(firmwareHash: FirmwareHashCheckResult | null): void;
    getCurrentSession(): TypedCallProvider;
    getCommands(): ReturnType<typeof DeviceCommands>;
    startPiggybackAck(): void;
    stopPiggybackAck(): Promise<void>;

    // ─── Status predicates ──────────────────────────────────────────────────────
    isUnacquired(): boolean;
    isUnreadable(): boolean;
    isBootloader(): boolean;
    isInitialized(): boolean;
    isSeedless(): boolean;
    isUsed(): boolean;
    isUsedHere(): boolean;
    isUsedElsewhere(): boolean;
    isT1(): boolean;
    atLeast(versions: string[] | string): boolean;
    hasUnexpectedMode(allow: string[]): string | null;

    // ─── Serialization ──────────────────────────────────────────────────────────
    toMessageObject(): Device;

    // ─── Event methods ──────────────────────────────────────────────────────────
    emit: TypedEmitter<DeviceEvents>['emit'];
    prompt<T extends 'pin' | 'passphrase' | 'word' | 'thp_pairing'>(
        type: T,
        args: Omit<DeviceEvents[T], 'callback'>,
    ): Promise<Parameters<DeviceEvents[T]['callback']>[0]>;
    getFeatures(): Promise<void>;
}
