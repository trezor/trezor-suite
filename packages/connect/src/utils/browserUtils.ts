// original file
// https://github.com/trezor/connect/blob/develop/src/js/env/browser/browserUtils.js

import Bowser from 'bowser';
import { getBridgeInfo } from '../data/TransportInfo';
import { getUdevInfo } from '../data/UdevInfo';

export type BrowserState = {
    name: string;
    osname: string;
    supported: boolean;
    outdated: boolean;
    mobile: boolean;
};

const DEFAULT_STATE: BrowserState = {
    name: 'unknown',
    osname: 'unknown',
    supported: false,
    outdated: false,
    mobile: false,
};

type SupportedBrowser = {
    version: number;
    download: string;
    update: string;
};

export const getBrowserState = (supportedBrowsers: {
    [key: string]: SupportedBrowser;
}): BrowserState => {
    if (typeof window === 'undefined' || !navigator || !navigator.userAgent) return DEFAULT_STATE;
    const { browser, os, platform } = Bowser.parse(navigator.userAgent);
    const mobile = platform.type === 'mobile';
    let supported = browser.name ? supportedBrowsers[browser.name.toLowerCase()] : null;
    let outdated = false;

    if (mobile && typeof navigator.usb === 'undefined') {
        supported = null;
    }
    if (supported) {
        // REF-TODO
        // @ts-ignore (not doing runtime changes during transfer)
        outdated = supported.version > parseInt(browser.version, 10);
        if (outdated) {
            supported = null;
        }
    }

    return {
        name: `${browser.name}: ${browser.version}; ${os.name}: ${os.version};`,
        // REF-TODO
        // @ts-ignore (not doing runtime changes during transfer)
        osname: os.name,
        mobile,
        supported: !!supported,
        outdated,
    };
};

export const getOS = () => {
    if (typeof window === 'undefined' || !navigator || !navigator.userAgent) return 'unknown';
    const { os } = Bowser.parse(navigator.userAgent);
    return os.name ? os.name.toLowerCase() : 'unknown';
};

export const getSuggestedPlatform = () => {
    if (typeof window === 'undefined' || !navigator || !navigator.userAgent) return;
    // Find preferred platform using bowser and userAgent
    const agent = navigator.userAgent;
    const { os } = Bowser.parse(agent);
    const name = os.name ? os.name.toLowerCase() : null;
    switch (name) {
        case 'linux': {
            const isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/)
                ? 'rpm'
                : 'deb';
            const is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';
            return `${isRpm}${is64x}`;
        }
        case 'macos':
            return 'mac';
        case 'windows': {
            const arch = agent.match(/(Win64|WOW64)/) ? '64' : '32';
            return `win${arch}`;
        }
        default:
            break;
    }
};

export const suggestBridgeInstaller = () => {
    const info = getBridgeInfo();
    // check if preferred field was already added
    if (!info.packages.find(p => p.preferred)) {
        const platform = getSuggestedPlatform();
        if (platform) {
            // override BridgeInfo packages, add preferred field
            info.packages = info.packages.map(p => ({
                ...p,
                preferred: p.platform.indexOf(platform) >= 0,
            }));
        }
    }
    return info;
};

export const suggestUdevInstaller = () => {
    const info = getUdevInfo();
    // check if preferred field was already added
    if (!info.packages.find(p => p.preferred)) {
        const platform = getSuggestedPlatform();
        if (platform) {
            // override UdevInfo packages, add preferred field
            info.packages = info.packages.map(p => ({
                ...p,
                preferred: p.platform.indexOf(platform) >= 0,
            }));
        }
    }
    return info;
};
