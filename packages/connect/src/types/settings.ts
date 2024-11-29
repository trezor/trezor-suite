import type { BlockchainSettings } from '@trezor/blockchain-link';
import type { Transport } from '@trezor/transport';

export type { SystemInfo } from '@trezor/connect-common';
export interface Manifest {
    appUrl: string;
    email: string;
}

export type Proxy = BlockchainSettings['proxy'];

// omit transports which are not implemented in @trezor/connect
type KnownTransport = Exclude<Transport['name'], 'NativeUsbTransport' | 'BluetoothTransport'>;

export interface ConnectSettingsPublic {
    manifest?: Manifest;
    connectSrc?: string;
    debug?: boolean;
    popup?: boolean;
    transportReconnect?: boolean;
    transports?: (KnownTransport | Transport | (new (...args: any[]) => Transport))[];
    pendingTransportEvent?: boolean;
    lazyLoad?: boolean;
    interactionTimeout?: number;
    trustedHost: boolean;
    /**
     * for internal use only!
     * in some exotic setups (suite-web where iframe is embedded locally), you might need to tell connect where it should search for sessions background shared-worker
     */
    _sessionsBackgroundUrl?: null | string;
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
}

export interface ConnectSettingsWeb {
    hostLabel?: string;
    hostIcon?: string;
    coreMode?: 'auto' | 'popup' | 'iframe' | 'deeplink' | 'suite-desktop';
}
export interface ConnectSettingsWebextension {
    /** _extendWebextensionLifetime features makes the service worker in @trezor/connect-webextension stay alive longer */
    _extendWebextensionLifetime?: boolean;
}
export interface ConnectSettingsMobile {
    deeplinkUrl: string;
    deeplinkOpen?: (url: string) => void;
    deeplinkCallbackUrl?: string;
}

export type ConnectSettings = ConnectSettingsPublic &
    ConnectSettingsInternal &
    ConnectSettingsWeb &
    ConnectSettingsWebextension &
    ConnectSettingsMobile;
