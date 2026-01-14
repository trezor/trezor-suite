import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { DeviceModelInternal } from '@trezor/device-utils';
import type { ThpCredentials, ThpPairingMethod } from '@trezor/protocol';
import type { Transport } from '@trezor/transport';
import { PartialRecord } from '@trezor/type-utils';

import type { FirmwareUpdateSource } from '../types/firmware';

export type { SystemInfo } from '@trezor/connect-common';
export interface Manifest {
    appName: string;
    appIcon?: string;
    appUrl: string;
    email: string;
}

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

export interface ConnectSettingsPublic {
    manifest?: Manifest;
    connectSrc?: string;
    debug?: boolean;
    popup?: boolean;
    transportReconnect?: boolean;
    transports?: ConnectSettingsTransport[];
    pendingTransportEvent?: boolean;
    lazyLoad?: boolean;
    interactionTimeout?: number;
    trustedHost: boolean;
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
    useCoreInPopup?: boolean;
    localFirmwares?: LocalFirmwares;
    firmwareUpdateSource?: FirmwareUpdateSource;
}

export interface ConnectSettingsWeb {
    hostLabel?: string;
    coreMode?: 'auto' | 'deeplink' | 'suite-desktop' | 'suite-web';
}
export interface ConnectSettingsWebextension {
    /** _extendWebextensionLifetime features makes the service worker in @trezor/connect-webextension stay alive longer */
    _extendWebextensionLifetime?: boolean;
    coreMode?: 'auto' | 'suite-desktop' | 'suite-web';
}
export interface ConnectSettingsMobile {
    deeplinkUrl: string;
    deeplinkOpen?: (url: string) => void;
    deeplinkCallbackUrl?: string;
    coreMode?: 'deeplink';
}

export type ConnectSettings = ConnectSettingsPublic &
    ConnectSettingsInternal &
    // coreMode is a common parameter between these, so it is explicitly handled here for correct handling
    Omit<ConnectSettingsWeb & ConnectSettingsWebextension & ConnectSettingsMobile, 'coreMode'> & {
        coreMode?:
            | ConnectSettingsWeb['coreMode']
            | ConnectSettingsWebextension['coreMode']
            | ConnectSettingsMobile['coreMode'];
    };
