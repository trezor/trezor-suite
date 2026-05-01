import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { DeviceModelInternal } from '@trezor/device-utils';
import type { ThpCredentials, ThpPairingMethod } from '@trezor/protocol';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';
import type { Transport } from '@trezor/transport';
import type { PartialRecord } from '@trezor/type-utils';

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

export type ThpSettings = {
    hostName?: string; // displayed on Trezor during pairing process.
    appName?: string; // displayed on Trezor during pairing process. fallbacks to Manifest['appName']
    knownCredentials?: ThpCredentials[]; // credentials received after the pairing process
    pairingMethods: ThpPairingMethod[] | (keyof typeof ThpPairingMethod)[]; // pairing methods supported by the host
};

/**
 * Connect now uses pure dependency injection for transports — callers must
 * pass either a constructed Transport instance or a Transport constructor.
 * String discriminators (`'BridgeTransport'`, `'WebUsbTransport'`, …) used
 * pre-v10 are no longer accepted; the host application is responsible for
 * importing the right transport class for its environment and providing the
 * defaults.
 */
export type ConnectSettingsTransport = Transport | (new (...args: any[]) => Transport);

export interface ConnectSettingsPublic {
    manifest?: Manifest;
    debug?: boolean;
    transportReconnect?: boolean;
    transports?: ConnectSettingsTransport[];
    /**
     * Serializable transport selection by registry id. Used at process
     * boundaries (e.g. the desktop renderer → main IPC proxy) where
     * Transport instances cannot cross. The receiving side is expected
     * to map ids to instances via its own registry before forwarding to
     * connect's `init` / `updateConnectSettings`.
     */
    transportIds?: string[];
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
    sharedLogger?: boolean;
    localFirmwares?: LocalFirmwares;
    firmwareChannel?: FirmwareChannel;
}

export type ConnectSettings = ConnectSettingsPublic &
    ConnectSettingsInternal &
    // coreMode is a common parameter between these, so it is explicitly handled here for correct handling
    { coreMode?: 'auto' | 'suite-desktop' | 'suite-web' | 'deeplink' };
