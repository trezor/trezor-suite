import { FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import type {
    DecodedTrezorPushNotification,
    TransportProtocol,
    thp as protocolThp,
} from '@trezor/protocol';
import { Descriptor, type Transport } from '@trezor/transport';
import { type TypedEmitter, type VersionArray } from '@trezor/utils';

import type {
    Device,
    DeviceBusyStatus,
    DeviceFirmwareStatus,
    DeviceState,
    DeviceUniquePath,
    Features,
    FirmwareHashCheckResult,
    KnownDevice,
    UnavailableCapabilities,
} from './device';
import type { FirmwareReleaseConfigInfo } from './firmware';
import type { TypedCallProvider } from './typed-call-provider';

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
    setupThp(): Promise<void>;
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
}
