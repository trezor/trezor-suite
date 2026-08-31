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
import type { PermissionRequest } from './method';
import type { WardProvider } from './ward';

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

export type ThpSettings = {
    hostName?: string; // displayed on Trezor during pairing process.
    appName?: string; // displayed on Trezor during pairing process. fallbacks to Manifest['appName']
    knownCredentials?: ThpCredentials[]; // credentials received after the pairing process
    pairingMethods: ThpPairingMethod[] | (keyof typeof ThpPairingMethod)[]; // pairing methods supported by the host
};

export type ConnectSettingsTransport = Transport;

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
    // Permissions the host/dapp declares up front so the user can approve the whole set in a single
    // consent instead of being prompted per call. Like `manifest`, this is host-side authorization
    // that Core never reads — it is forwarded to the popup host (via the handshake), which sanitizes
    // it. Orthogonal to `enabledNetworks` (a Core capability); see the note on `EnabledNetwork`
    // above. `coin` is the `coinInfo.shortcut` (matched case-insensitively by the popup).
    requestedPermissions?: PermissionRequest[];
    // Answers the device's mid-call WARD pulls (`WardEntryRequest` -> `WardEntryAck`), supplied by
    // the host application. Core registers it at init; when omitted, connect registers a stub that
    // fails the pull loudly rather than leaving the device call hanging.
    wardProvider?: WardProvider;
}

export type ConnectImplSettings = {
    manifest: Manifest;
    version: string;
    env?: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    debug?: boolean;
    enabledNetworks?: EnabledNetwork[];
    requestedPermissions?: PermissionRequest[];
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
