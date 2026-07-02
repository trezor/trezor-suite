import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { DeviceModelInternal } from '@trezor/device-utils';
import type { ThpCredentials, ThpPairingMethod } from '@trezor/protocol';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';
import type { Transport } from '@trezor/transport-common';
import type { PartialRecord } from '@trezor/type-utils';
import type { Logger } from '@trezor/utils';

import type { CoinSymbol } from './coinInfo';
import type { DefinitionsChannel } from './definitions';
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

export type CreateLoggerDep = { createLogger?: CreateLogger };

// #23879 originally expected the permission system to extend this object with per-network
// fields (e.g. `permissions`, `backends`). It went the other way: `EnabledNetwork` stayed a
// minimal Core capability — it only drives `derive_cardano` at session create — orthogonal to
// permissions, which are host-side authorization Core never reads. The two are linked by a
// projection (the connect-popup maps a granted coin to an enabled network), not by merging
// fields into this object.
export interface EnabledNetwork {
    coin: CoinSymbol;
}

export interface ConnectSettings {
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
    firmwareChannel?: FirmwareChannel;
    definitionsChannel?: DefinitionsChannel;
    localFirmwares?: LocalFirmwares;
    thp?: ThpSettings;
    enabledNetworks?: EnabledNetwork[];
}

export type ConnectImplSettings = {
    manifest: Manifest;
    version: string;
    env?: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    debug?: boolean;
    enabledNetworks?: EnabledNetwork[];
};

export type ConnectDynamicSettings = Partial<ConnectImplSettings> & {
    coreMode?: 'auto' | 'suite-desktop' | 'suite-web';
};

export interface ConnectMobileSettings {
    manifest: Manifest;
    connectSrc?: string;
    deeplinkOpen: (url: string) => void;
    deeplinkCallbackUrl: string;
}
