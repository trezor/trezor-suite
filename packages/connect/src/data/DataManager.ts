// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import parseUri from 'parse-uri';
import { httpRequest } from '../utils/assets';
import { DEFAULT_PRIORITY } from './connectSettings';
import { parseCoinsJson } from './coinInfo';
import { parseFirmware } from './firmwareInfo';
import { parseBridgeJSON } from './transportInfo';
import { config } from './config';

import type { ConnectSettings } from '../types';

type AssetCollection = { [key: string]: JSON };

export class DataManager {
    static assets: AssetCollection = {};

    static settings: ConnectSettings;

    private static messages: JSON;

    static async load(settings: ConnectSettings, withAssets = true) {
        const ts = settings.env === 'web' ? `?r=${settings.timestamp}` : '';
        this.settings = settings;

        // check if origin is localhost or trusted
        const isLocalhost =
            typeof window !== 'undefined' && window.location
                ? window.location.hostname === 'localhost'
                : true;
        const whitelist = DataManager.isWhitelisted(this.settings.origin || '');
        this.settings.trustedHost = (isLocalhost || !!whitelist) && !this.settings.popup;
        // ensure that popup will be used
        if (!this.settings.trustedHost) {
            this.settings.popup = true;
        }
        // ensure that debug is disabled
        if (!this.settings.trustedHost && !whitelist) {
            this.settings.debug = false;
        }

        this.settings.priority = DataManager.getPriority(whitelist);

        const knownHost = DataManager.getHostLabel(
            this.settings.extension || this.settings.origin || '',
        );
        if (knownHost) {
            this.settings.hostLabel = knownHost.label;
            this.settings.hostIcon = knownHost.icon;
        }

        // hotfix webusb + chrome:72, allow webextensions
        if (this.settings.popup && this.settings.env !== 'webextension') {
            // allow all but WebUsbTransport
            this.settings.transports = this.settings.transports?.filter(
                (transport: string) => transport !== 'WebUsbTransport',
            );
        }

        if (!withAssets) return;

        const assetPromises = config.assets.map(async asset => {
            const json = await httpRequest(`${asset.url}${ts}`, 'json');
            this.assets[asset.name] = json;
        });
        await Promise.all(assetPromises);

        this.messages = await httpRequest(`${config.messages}${ts}`, 'json');

        // parse bridge JSON
        parseBridgeJSON(this.assets.bridge);

        // parse coins definitions
        parseCoinsJson(this.assets.coins);

        // parse firmware definitions
        parseFirmware(this.assets['firmware-t1'], 1);
        parseFirmware(this.assets['firmware-t2'], 2);
    }

    static getProtobufMessages() {
        return this.messages;
    }

    static isWhitelisted(origin: string) {
        const uri = parseUri(origin);
        if (uri && typeof uri.host === 'string') {
            const parts = uri.host.split('.');
            if (parts.length > 2) {
                // subdomain
                uri.host = parts.slice(parts.length - 2, parts.length).join('.');
            }
            return config.whitelist.find(
                item => item.origin === origin || item.origin === uri.host,
            );
        }
    }

    static isManagementAllowed() {
        const uri = parseUri(this.settings.origin ?? '');
        if (uri && typeof uri.host === 'string') {
            const parts = uri.host.split('.');
            if (parts.length > 2) {
                // subdomain
                uri.host = parts.slice(parts.length - 2, parts.length).join('.');
            }
            return config.management.find(
                item => item.origin === this.settings.origin || item.origin === uri.host,
            );
        }
    }

    static getPriority(whitelist?: (typeof config)['whitelist'][0]) {
        if (whitelist) {
            return whitelist.priority;
        }
        return DEFAULT_PRIORITY;
    }

    static getHostLabel(origin: string) {
        return config.knownHosts.find(host => host.origin === origin);
    }

    static getSettings(key?: undefined): ConnectSettings;
    static getSettings<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];
    static getSettings(key?: keyof ConnectSettings) {
        if (!this.settings) return null;
        if (typeof key === 'string') {
            return this.settings[key];
        }
        return this.settings;
    }
}
