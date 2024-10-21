import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { Transport } from '@trezor/transport';
import type { KnownDevice } from './device';

export type { SystemInfo } from '@trezor/connect-common';
export interface Manifest {
    appUrl: string;
    email: string;
}

export type Proxy = BlockchainSettings['proxy'];

export interface ConnectSettingsPublic {
    manifest?: Manifest;
    connectSrc?: string;
    debug?: boolean;
    hostLabel?: string;
    hostIcon?: string;
    popup?: boolean;
    transportReconnect?: boolean;
    webusb?: boolean; // deprecated
    transports?: (Transport['name'] | Transport | (new (...args: any[]) => Transport))[];
    knownDevices?: Pick<KnownDevice, '_state'>[];
    pendingTransportEvent?: boolean;
    lazyLoad?: boolean;
    interactionTimeout?: number;
    trustedHost: boolean;
    coreMode?: 'auto' | 'popup' | 'iframe' | 'deeplink';
    /* _extendWebextensionLifetime features makes the service worker in @trezor/connect-webextension stay alive longer */
    _extendWebextensionLifetime?: boolean;
    /**
     * for internal use only!
     * in some exotic setups (suite-web where iframe is embedded locally), you might need to tell connect where it should search for sessions background shared-worker
     */
    _sessionsBackgroundUrl?: string;
    // Options for Connect-mobile deep linking
    deeplinkOpen?: (url: string) => void;
    deeplinkCallbackUrl?: string;
    // URL for binary files such as firmware, may be local or remote
    binFilesBaseUrl?: string;
    // enable firmware hash check automatically when device connects. Requires binFilesBaseUrl to be set.
    enableFirmwareHashCheck?: boolean;
}

// internal part, not to be accepted from .init()
export interface ConnectSettingsInternal {
    origin?: string;
    configSrc: string;
    iframeSrc: string;
    popupSrc: string;
    webusbSrc: string;
    version: string;
    priority: number;
    extension?: string;
    env: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    timestamp: number;
    proxy?: Proxy;
    sharedLogger?: boolean;
    useCoreInPopup?: boolean;
    deeplinkUrl: string;
}

export type ConnectSettings = ConnectSettingsPublic & ConnectSettingsInternal;
