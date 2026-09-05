// origin: https://github.com/trezor/connect/blob/develop/src/js/data/ConnectSettings.js

import { sanitizeName } from './sanitizeName';
import { parseThpSettings } from './thpSettings';
import { VERSION } from './version';
import { DEFINITIONS_CHANNELS } from '../types/definitions';
import type { DefinitionsChannel } from '../types/definitions';
import type { ConnectSettings, LocalFirmwares, Manifest } from '../types/settings';

/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */

const initialSettings: ConnectSettings = {
    debug: false,
    transports: undefined,
    pendingTransportEvent: true,
    transportReconnect: true,
};

export const parseManifest = (manifest?: Manifest) => {
    if (!manifest) return;
    if (typeof manifest.email !== 'string') return;
    if (typeof manifest.appUrl !== 'string') return;
    if (typeof manifest.appName !== 'string') return;
    if (typeof manifest.appIcon !== 'undefined' && typeof manifest.appIcon !== 'string') return;

    const appName = sanitizeName(manifest.appName);
    if (!appName) return;

    return {
        email: manifest.email,
        appUrl: manifest.appUrl,
        appName,
        appIcon: manifest.appIcon,
    };
};

export const parseVersion = (version?: string) => (typeof version === 'string' ? version : VERSION);

export const parseLocalFirmwares = (localFirmwares: LocalFirmwares) => {
    if (!localFirmwares) return;
    if (typeof localFirmwares.firmwareDir !== 'string') return;
    if (!Array.isArray(localFirmwares.firmwareList)) return;

    return {
        firmwareDir: localFirmwares.firmwareDir,
        firmwareList: localFirmwares.firmwareList,
    };
};

// Cors validation copied from Trezor Bridge
// see: https://github.com/trezor/trezord-go/blob/05991cea5900d18bcc6ece5ae5e319d138fc5551/server/api/api.go#L229
// Its pointless to allow `@trezor/connect` endpoints { connectSrc } for domains other than listed below
// `trezord` will block communication anyway
export const corsValidator = (url?: string) => {
    if (typeof url !== 'string') return;
    if (url === '../') return url; // suite-web way
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

    // Runtime function supplied by the host composition root; passthrough (not validated).
    if (typeof input.createLogger === 'function') {
        settings.createLogger = input.createLogger;
    }

    if (typeof input.transportReconnect === 'boolean') {
        settings.transportReconnect = input.transportReconnect;
    }

    if (typeof input.localFirmwares === 'object') {
        settings.localFirmwares = parseLocalFirmwares(input.localFirmwares);
    }

    if (typeof input.firmwareChannel === 'string') {
        settings.firmwareChannel = input.firmwareChannel;
    }

    if (DEFINITIONS_CHANNELS.includes(input.definitionsChannel as DefinitionsChannel)) {
        settings.definitionsChannel = input.definitionsChannel;
    }

    if (Array.isArray(input.transports)) {
        settings.transports = input.transports;
    }

    if (typeof input.pendingTransportEvent === 'boolean') {
        settings.pendingTransportEvent = input.pendingTransportEvent;
    }

    if (typeof input.manifest === 'object') {
        settings.manifest = parseManifest(input.manifest);
    }

    if (typeof input.binFilesBaseUrl === 'string') {
        settings.binFilesBaseUrl = input.binFilesBaseUrl;
    }

    if (typeof input.enableFirmwareHashCheck === 'boolean') {
        settings.enableFirmwareHashCheck = Boolean(input.enableFirmwareHashCheck);
    }

    if (
        // non-exhaustive Record is expected, so all we need to validate is that it's an indexable object.
        typeof input.firmwareHashCheckTimeouts === 'object' &&
        input.firmwareHashCheckTimeouts !== null
    ) {
        settings.firmwareHashCheckTimeouts = input.firmwareHashCheckTimeouts;
    }

    if (Array.isArray(input.enabledNetworks)) {
        settings.enabledNetworks = input.enabledNetworks;
    }

    settings.thp = parseThpSettings(input);

    return settings;
};
