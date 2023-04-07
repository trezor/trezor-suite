import { parseConnectSettings as parseSettings, ConnectSettings } from '@trezor/connect';
import { config } from '@trezor/connect/src/data/config';
import { DEFAULT_PRIORITY } from '@trezor/connect/src/data/connectSettings';
import { getHost } from '@trezor/connect/src/utils/urlUtils';

export const isOriginWhitelisted = (origin: string) => {
    const host = getHost(origin);
    return config.whitelist.find(item => item.origin === origin || item.origin === host);
};

const getPriority = (whitelist?: (typeof config)['whitelist'][0]) => {
    if (whitelist) {
        return whitelist.priority;
    }
    return DEFAULT_PRIORITY;
};

const getHostLabel = (origin: string) => config.knownHosts.find(host => host.origin === origin);

/**
 * Receive settings from @trezor/connect-web hosted on 3rd party domain and validate sensitive values (origin, popup etc.)
 * Returned settings are considered as safe since this script runs on trusted domain.
 * @param input Partial<ConnectSettings>
 */
export const parseConnectSettings = (
    input: Partial<ConnectSettings> = {},
    origin: string,
): ConnectSettings => {
    const settings = parseSettings(input);

    // occasionally received origin is a stringified "null" or empty string. rename it to avoid confusion
    settings.origin = !origin || origin === 'null' ? 'unknown' : origin;

    // check if iframe is running on localhost
    const isLocalhost = window?.location?.hostname === 'localhost';
    // check if origin is whitelisted
    const whitelist = isOriginWhitelisted(settings.origin);

    settings.trustedHost = (isLocalhost || !!whitelist) && !settings.popup;

    // ensure that popup will be used
    if (!settings.trustedHost) {
        settings.popup = true;
    }

    // ensure that debug is disabled
    if (!settings.trustedHost && !whitelist && !isLocalhost) {
        settings.debug = false;
    }

    settings.priority = getPriority(whitelist);

    let disableWebUsb = false;
    // disable webusb on local files
    if (window?.location?.protocol === 'file:') {
        settings.origin = `file://${window.location.pathname}`;
        settings.webusb = false;
        disableWebUsb = true;
    }

    // hotfix webusb + chrome:72, allow webextensions
    if (settings.popup && settings.env !== 'webextension') {
        disableWebUsb = true;
        settings.webusb = false;
    }

    if (disableWebUsb) {
        // allow all but WebUsbTransport
        settings.transports = settings.transports?.filter(
            transport => transport !== 'WebUsbTransport',
        );
    }

    const knownHost = getHostLabel(settings.extension || settings.origin || '');
    if (knownHost) {
        settings.hostLabel = knownHost.label;
        settings.hostIcon = knownHost.icon;
    }

    return settings;
};
