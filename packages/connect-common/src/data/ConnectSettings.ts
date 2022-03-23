/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */

const VERSION = '8.2.7-beta.3';
const versionN = VERSION.split('.').map(s => parseInt(s, 10));
// const DIRECTORY = `${ versionN[0] }${ (versionN[1] > 0 ? `.${versionN[1]}` : '') }/`;
const DIRECTORY = `${versionN[0]}/`;
const DEFAULT_DOMAIN = `https://connect.trezor.io/${DIRECTORY}`;
export const DEFAULT_PRIORITY = 2;

export type Manifest = {
    appUrl: string;
    email: string;
};

export type Proxy =
    | string
    | {
          // Partial (useful) BlockchainLinkOptions.proxy
          protocol?: 'socks4' | 'socks4a' | 'socks' | 'socks5' | 'socks5h';
          host: string;
          port: string | number;
          username?: string;
          password?: string;
      };

export type ConnectSettings = {
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
    // configSrc: string,
    configSrc?: string;
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
};

// todo: settings type
const initialSettings: ConnectSettings = {
    // configSrc: './data/config.json', // constant
    // configSrc
    version: VERSION, // constant
    debug: false,
    priority: DEFAULT_PRIORITY,
    trustedHost: false,
    connectSrc: DEFAULT_DOMAIN,
    iframeSrc: `${DEFAULT_DOMAIN}iframe.html`,
    popup: true,
    popupSrc: `${DEFAULT_DOMAIN}popup.html`,
    webusbSrc: `${DEFAULT_DOMAIN}webusb.html`,
    transportReconnect: false,
    webusb: true,
    pendingTransportEvent: true,
    supportedBrowser:
        typeof navigator !== 'undefined' ? !/Trident|MSIE|Edge/.test(navigator.userAgent) : true,
    manifest: undefined,
    env: 'web',
    lazyLoad: false,
    timestamp: new Date().getTime(),
    interactionTimeout: 600, // 5 minutes
};

// todo:
let currentSettings = initialSettings;

// todo: manifest type
const parseManifest = (manifest: any) => {
    if (!manifest) return;
    if (typeof manifest.email !== 'string') return;
    if (typeof manifest.appUrl !== 'string') return;

    return {
        email: manifest.email,
        appUrl: manifest.appUrl,
    };
};

export const getEnv = () => {
    if (
        // @ts-ignore
        typeof chrome !== 'undefined' &&
        // @ts-ignore
        chrome.runtime &&
        // @ts-ignore
        typeof chrome.runtime.onConnect !== 'undefined'
    ) {
        return 'webextension';
    }
    if (typeof navigator !== 'undefined') {
        if (
            typeof navigator.product === 'string' &&
            navigator.product.toLowerCase() === 'reactnative'
        ) {
            return 'react-native';
        }
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            return 'electron';
        }
    }
    // if (typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative') {
    //     return 'react-native';
    // }
    // if (typeof process !== 'undefined' && process.versions.hasOwnProperty('electron')) {
    //     return 'electron';
    // }
    return 'web';
};

// Cors validation copied from Trezor Bridge
// see: https://github.com/trezor/trezord-go/blob/05991cea5900d18bcc6ece5ae5e319d138fc5551/server/api/api.go#L229
// Its pointless to allow `trezor-connect` endpoints { connectSrc } for domains other than listed below
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

// todo: type
export const parseConnectSettings = (input: any = {}): ConnectSettings => {
    console.log('ConnectSettings.parse input', input);
    const settings = { ...currentSettings };
    if ('debug' in input) {
        // todo: ???
        if (Array.isArray(input)) {
            // enable log with prefix
        }
        if (typeof input.debug === 'boolean') {
            settings.debug = input.debug;
        } else if (typeof input.debug === 'string') {
            settings.debug = input.debug === 'true';
        }
    }

    if (typeof input.connectSrc === 'string') {
        settings.connectSrc = input.connectSrc;
    }
    // For debugging purposes `connectSrc` could be defined in `global.__TREZOR_CONNECT_SRC` variable
    // @ts-ignore
    if (typeof global !== 'undefined' && typeof global.__TREZOR_CONNECT_SRC === 'string') {
        // @ts-ignore
        settings.connectSrc = corsValidator(global.__TREZOR_CONNECT_SRC);
        settings.debug = true;
    }

    // For debugging purposes `connectSrc` could be defined in url query of hosting page. Usage:
    // https://3rdparty-page.com/?trezor-connect-src=https://localhost:8088/
    if (
        typeof window !== 'undefined' &&
        window.location &&
        typeof window.location.search === 'string'
    ) {
        const vars = window.location.search.split('&');
        const customUrl = vars.find(v => v.indexOf('trezor-connect-src') >= 0);
        if (customUrl) {
            const [, connectSrc] = customUrl.split('=');
            settings.connectSrc = corsValidator(decodeURIComponent(connectSrc));
            settings.debug = true;
        }
    }
    const src = settings.connectSrc || DEFAULT_DOMAIN;
    settings.iframeSrc = `${src}iframe.html`;
    settings.popupSrc = `${src}popup.html`;
    settings.webusbSrc = `${src}webusb.html`;

    if (typeof input.transportReconnect === 'boolean') {
        settings.transportReconnect = input.transportReconnect;
    }

    if (typeof input.webusb === 'boolean') {
        settings.webusb = input.webusb;
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

    // local files
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        settings.origin = `file://${window.location.pathname}`;
        settings.webusb = false;
    }

    if (typeof input.extension === 'string') {
        settings.extension = input.extension;
    }

    if (typeof input.env === 'string') {
        settings.env = input.env;
    } else {
        settings.env = getEnv();
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

    currentSettings = settings;

    console.log('ConnectSettings.parse end', currentSettings);

    return currentSettings;
};
