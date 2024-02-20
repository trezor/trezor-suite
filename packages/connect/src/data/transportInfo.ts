// origin: https://github.com/trezor/connect/blob/develop/src/js/data/TransportInfo.js

import type { BridgeInfo } from '../events/transport';

const info: BridgeInfo = {
    version: [],
    directory: '',
    packages: [],
    changelog: '',
};

// Parse JSON loaded from config.assets.bridge
export const parseBridgeJSON = (json: any) => {
    const latest = json[0];
    const version = latest.version.join('.');
    const data: BridgeInfo = JSON.parse(JSON.stringify(latest).replace(/{version}/g, version));
    const { directory } = data;
    const packages = data.packages.map(p => ({
        name: p.name,
        platform: p.platform,
        url: `${directory}${p.url}`,
        signature: p.signature ? `${directory}${p.signature}` : undefined,
    }));

    info.version = data.version;
    info.directory = directory;
    info.packages = packages;

    return info;
};

export const getBridgeInfo = (): BridgeInfo => info;

export const suggestBridgeInstaller = (platform?: string) => {
    const info = getBridgeInfo();
    // check if preferred field was already added
    if (!info.packages.find(p => p.preferred)) {
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
