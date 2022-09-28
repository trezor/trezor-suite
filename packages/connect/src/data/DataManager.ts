// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import parseUri from 'parse-uri';
import { DEFAULT_PRIORITY } from './connectSettings';
import { config } from './config';

import type { ConnectSettings } from '../types';
import { parseCoinsJSON } from './coinInfo';
import { parseBridgeJSON } from './transportInfo';
import { parseFirmwareJSON } from './firmwareInfo';

import coinsJSON from '@trezor/connect-common/files/coins.json';
import bridgeJSON from '@trezor/connect-common/files/bridge/releases.json';
import firmwareT1 from '@trezor/connect-common/files/firmware/1/releases.json';
import firmwareT2 from '@trezor/connect-common/files/firmware/2/releases.json';

export class DataManager {
    static settings: ConnectSettings;

    private static messages = config.messages;

    static load(settings: ConnectSettings) {
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
        if (this.settings.popup && this.settings.webusb && this.settings.env !== 'webextension') {
            this.settings.webusb = false;
        }

        parseFirmwareJSON(firmwareT1, 1);
        parseFirmwareJSON(firmwareT2, 2);
        parseBridgeJSON(bridgeJSON);
        parseCoinsJSON(coinsJSON);
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

    static getPriority(whitelist?: typeof config['whitelist'][0]) {
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
