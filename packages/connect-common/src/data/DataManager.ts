/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

// todo: parse-uri, move to @trezor/utils maybe?
// @ts-ignore
// import parseUri from 'parse-uri';
import { parseUri } from '@trezor/utils';
import { DEFAULT_PRIORITY } from './ConnectSettings';
import type { ConnectSettings } from './ConnectSettings';

import { parseCoinsJson } from './CoinInfo';
import { parseFirmware } from './FirmwareInfo';
import { parseBridgeJSON } from './TransportInfo';

import * as coinsJSON from '../files/coins.json';
import * as messagesJSON from '../files/messages.json';
import * as releasesBridgeJSON from '../files/bridge/releases.json';
import * as releases1JSON from '../files/firmware/1/releases.json';
import * as releases2JSON from '../files/firmware/2/releases.json';
import * as config from '../files/config.json';

type WhiteList = {
    priority: number;
    origin: string;
};

type KnownHost = {
    origin: string;
    label?: string;
    icon?: string;
};

type SupportedBrowser = {
    version: number;
    download: string;
    update: string;
};

type WebUSB = {
    vendorId: string;
    productId: string;
};

type Resources = {
    bridge: string;
};

export type Config = {
    whitelist: WhiteList[];
    management: WhiteList[];
    knownHosts: KnownHost[];
    onionDomains: { [key: string]: string };
    webusb: WebUSB[];
    resources: Resources;

    // todo: change
    messages: any;
    supportedBrowsers: { [key: string]: SupportedBrowser };
    supportedFirmware: Array<{
        coinType?: string;
        coin?: string | string[];
        methods?: string[];
        capabilities?: string[];
        min?: string[];
        max?: string[];
    }>;
};

type AssetCollection = { [key: string]: JSON };

export class DataManager {
    static config: Config;

    static assets: AssetCollection = {};

    static settings: ConnectSettings;

    static messages = {};

    static async load(settings: ConnectSettings) {
        // todo: why timestamp? ah, probably to invalidate cache?
        // const ts = settings.env === 'web' ? `?r=${settings.timestamp}` : '';
        this.settings = settings;
        // todo: probably could become static import?
        if (settings.configSrc) {
            console.log('=== loading config from src');
            this.config = await require(settings.configSrc);
            console.log('loaded', this.config);
        } else {
            console.log('using config from import');
            // @ts-ignore
            this.config = config;
            console.log('loaded', this.config);
        }

        console.log('===', settings);

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
        if (this.settings.popup && this.settings.webusb && this.settings.env !== 'webextension') {
            this.settings.webusb = false;
        }

        // todo: remove 'default' nesting
        this.messages = messagesJSON;

        // parse bridge JSON
        parseBridgeJSON(releasesBridgeJSON);

        // parse coins definitions
        parseCoinsJson(coinsJSON);

        // parse firmware definitions
        parseFirmware(releases1JSON, 1);
        parseFirmware(releases2JSON, 2);
    }

    // todo: remove ?
    static getProtobufMessages() {
        return this.messages;
    }

    static isWhitelisted(origin: string) {
        if (!this.config) return;
        const uri = parseUri(origin);
        if (uri && typeof uri.host === 'string') {
            const parts = uri.host.split('.');
            if (parts.length > 2) {
                // subdomain
                uri.host = parts.slice(parts.length - 2, parts.length).join('.');
            }
            return this.config.whitelist.find(
                item => item.origin === origin || item.origin === uri.host,
            );
        }
    }

    static isManagementAllowed() {
        if (!this.config) return;
        const uri = parseUri(this.settings.origin!);
        if (uri && typeof uri.host === 'string') {
            const parts = uri.host.split('.');
            if (parts.length > 2) {
                // subdomain
                uri.host = parts.slice(parts.length - 2, parts.length).join('.');
            }
            return this.config.management.find(
                item => item.origin === this.settings.origin || item.origin === uri.host,
            );
        }
    }

    static getPriority(whitelist?: WhiteList) {
        if (whitelist) {
            return whitelist.priority;
        }
        return DEFAULT_PRIORITY;
    }

    static getHostLabel(origin: string) {
        return this.config.knownHosts.find(host => host.origin === origin);
    }

    static getSettings(key?: keyof ConnectSettings) {
        if (!this.settings) return null;
        if (typeof key === 'string') {
            return this.settings[key];
        }
        return this.settings;
    }

    static getDebugSettings() {
        return false;
    }

    static getConfig() {
        return this.config;
    }
}
