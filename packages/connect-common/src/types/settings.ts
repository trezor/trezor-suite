import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { DeviceModelInternal } from '@trezor/device-utils';
import type { ThpCredentials, ThpPairingMethod } from '@trezor/protocol';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';
import type { Transport } from '@trezor/transport-common';
import type { PartialRecord } from '@trezor/type-utils';
import type { Logger } from '@trezor/utils';

import type { FirmwareChannel } from './firmware';

export const Manifest = Type.Object({
    appName: Type.String(),
    appIcon: Type.Optional(Type.String()),
    appUrl: Type.String(),
    email: Type.String(),
});
export type Manifest = Static<typeof Manifest>;

// timeouts for firmware hash check in milliseconds per model type
export type FirmwareHashCheckTimeouts = PartialRecord<DeviceModelInternal, number>;

export type Proxy = BlockchainSettings['proxy'];

export type LocalFirmwares = { firmwareDir: string; firmwareList: string[] };

// omit transports which are not implemented in @trezor/connect
type KnownTransport = Exclude<
    Transport['name'],
    'NativeUsbTransport' | 'BluetoothTransport' | 'NativeBluetoothTransport'
>;
export type ThpSettings = {
    hostName?: string; // displayed on Trezor during pairing process.
    appName?: string; // displayed on Trezor during pairing process. fallbacks to Manifest['appName']
    knownCredentials?: ThpCredentials[]; // credentials received after the pairing process
    pairingMethods: ThpPairingMethod[] | (keyof typeof ThpPairingMethod)[]; // pairing methods supported by the host
};

export type ConnectSettingsTransport =
    | KnownTransport
    | Transport
    | (new (...args: any[]) => Transport);

export type CreateLogger = (prefix: string) => Logger;

export interface ConnectSettingsPublic {
    manifest?: Manifest;
    // Enables connect logs. NOTE: connect core no longer uses this to gate its COMPONENT loggers
    // (Core/Device/DeviceCommands/@trezor/transport) — those are driven by `createLogger`. It is still
    // read by core's backend layer (BackendManager → BlockchainLink worker debug logging), by the
    // connect-web/connect-mobile host wrappers (their own `@trezor/connect-web` logger + popup URL),
    // and serves as the desktop IPC enabled hint that suite-desktop-core's trezor-connect.ts uses to
    // build the core's `createLogger` factory.
    debug?: boolean;
    // Logger factory supplied by the host composition root. Core expands it to logger instances for
    // internal components instead of creating its own loggers. When omitted, connect does not log
    // (no-op) — there is no internal fallback.
    // TODO(logger-unification): unify connect's logger with the rest of the app's loggers.
    createLogger?: CreateLogger;
    transportReconnect?: boolean;
    transports?: ConnectSettingsTransport[];
    pendingTransportEvent?: boolean;
    // URL for binary files such as firmware, may be local or remote
    binFilesBaseUrl?: string;
    // enable firmware hash check automatically when device connects. Requires binFilesBaseUrl to be set.
    enableFirmwareHashCheck?: boolean;
    firmwareHashCheckTimeouts?: FirmwareHashCheckTimeouts;
    thp?: ThpSettings;
}

// internal part, not to be accepted from .init()
export interface ConnectSettingsInternal {
    origin?: string;
    configSrc: string;
    popupSrc: string;
    version: string;
    npmVersion?: string;
    priority: number;
    extension?: string;
    env: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    timestamp: number;
    proxy?: Proxy;
    localFirmwares?: LocalFirmwares;
    firmwareChannel?: FirmwareChannel;
}

export type ConnectSettings = ConnectSettingsPublic &
    ConnectSettingsInternal &
    // coreMode is a common parameter between these, so it is explicitly handled here for correct handling
    { coreMode?: 'auto' | 'suite-desktop' | 'suite-web' | 'deeplink' };
