import type { BlockchainSettings } from '@trezor/blockchain-link';

export interface Manifest {
    appUrl: string;
    email: string;
}

export type Proxy = BlockchainSettings['proxy'];

export interface ConnectSettings {
    manifest?: Manifest;
    connectSrc?: string;
    debug?: boolean;
    hostLabel?: string;
    hostIcon?: string;
    popup?: boolean;
    transportReconnect?: boolean;
    webusb?: boolean;
    pendingTransportEvent?: boolean;
    lazyLoad?: boolean;
    interactionTimeout?: number;
    // internal part, not to be accepted from .init()
    origin?: string;
    configSrc: string;
    iframeSrc: string;
    popupSrc: string;
    webusbSrc: string;
    version: string;
    priority: number;
    trustedHost: boolean;
    supportedBrowser?: boolean;
    extension?: string;
    env: 'node' | 'web' | 'webextension' | 'electron' | 'react-native';
    timestamp: number;
    proxy?: Proxy;
    useOnionLinks?: boolean;
}
