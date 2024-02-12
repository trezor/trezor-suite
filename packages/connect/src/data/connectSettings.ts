// origin: https://github.com/trezor/connect/blob/develop/src/js/data/ConnectSettings.js

import type { Manifest, ConnectSettings } from '../types';
import { VERSION, DEFAULT_DOMAIN } from './version';

/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */

export const DEFAULT_PRIORITY = 2;

const initialSettings: ConnectSettings = {
    configSrc: './data/config.json', // constant
    version: VERSION, // constant
    debug: false,
    priority: DEFAULT_PRIORITY,
    trustedHost: true,
    connectSrc: DEFAULT_DOMAIN,
    iframeSrc: `${DEFAULT_DOMAIN}iframe.html`,
    popup: false,
    popupSrc: `${DEFAULT_DOMAIN}popup.html`,
    webusbSrc: `${DEFAULT_DOMAIN}webusb.html`,
    transports: undefined,
    pendingTransportEvent: true,
    env: 'node',
    lazyLoad: false,
    timestamp: new Date().getTime(),
    interactionTimeout: 600, // 5 minutes
    sharedLogger: true,
};

const parseManifest = (manifest?: Manifest) => {
    if (!manifest) return;
    if (typeof manifest.email !== 'string') return;
    if (typeof manifest.appUrl !== 'string') return;

    return {
        email: manifest.email,
        appUrl: manifest.appUrl,
    };
};

// Cors validation copied from Trezor Bridge
// see: https://github.com/trezor/trezord-go/blob/05991cea5900d18bcc6ece5ae5e319d138fc5551/server/api/api.go#L229
// Its pointless to allow `@trezor/connect` endpoints { connectSrc } for domains other than listed below
// `trezord` will block communication anyway
export const corsValidator = (url?: string) => {
    if (typeof url !== 'string') return;
    if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*trezor\.io\//)) return url;
    if (url.match(/^https?:\/\/localhost:[58][0-9]{3}\//)) return url;
    if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*sldev\.cz\//)) return url;
    if (
        url.match(
            /^https?:\/\/([A-Za-z0-9\-_]+\.)*trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad\.onion\//,
        )
    )
        return url;
};

export const parseConnectSettings = (input: Partial<ConnectSettings> = {}) => {
    const settings: ConnectSettings = { ...initialSettings };
    if ('debug' in input) {
        if (typeof input.debug === 'boolean') {
            settings.debug = input.debug;
        } else if (typeof input.debug === 'string') {
            settings.debug = input.debug === 'true';
        }
    }

    // trust level can only be lowered by implementator!
    if (input.trustedHost === false) {
        settings.trustedHost = input.trustedHost;
    }

    if (typeof input.connectSrc === 'string' && input.connectSrc?.startsWith('http')) {
        settings.connectSrc = corsValidator(input.connectSrc);
    } else if (settings.trustedHost) {
        settings.connectSrc = input.connectSrc;
    }

    const src = settings.connectSrc || DEFAULT_DOMAIN;
    settings.iframeSrc = `${src}iframe.html`;
    settings.popupSrc = `${src}popup.html`;
    settings.webusbSrc = `${src}webusb.html`;

    if (typeof input.transportReconnect === 'boolean') {
        settings.transportReconnect = input.transportReconnect;
    }

    // deprecated, settings.transport should be used instead
    if (typeof input.webusb === 'boolean') {
        settings.webusb = input.webusb;
    }

    if (Array.isArray(input.transports)) {
        settings.transports = input.transports;
    }

    if (typeof input.popup === 'boolean') {
        settings.popup = input.popup;
    }

    if (typeof input.lazyLoad === 'boolean') {
        settings.lazyLoad = input.lazyLoad;
    }

    if (typeof input.pendingTransportEvent === 'boolean') {
        settings.pendingTransportEvent = input.pendingTransportEvent;
    }

    if (typeof input.extension === 'string') {
        settings.extension = input.extension;
    }

    if (typeof input.env === 'string') {
        settings.env = input.env;
    }

    if (typeof input.timestamp === 'number') {
        settings.timestamp = input.timestamp;
    }

    if (typeof input.interactionTimeout === 'number') {
        settings.interactionTimeout = input.interactionTimeout;
    }

    if (typeof input.manifest === 'object') {
        settings.manifest = parseManifest(input.manifest);
    }

    if (typeof input.sharedLogger === 'boolean') {
        settings.sharedLogger = input.sharedLogger;
    }

    if (typeof input.useCoreInPopup === 'boolean') {
        settings.useCoreInPopup = input.useCoreInPopup;
    }

    return settings;
};
