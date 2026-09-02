import { firmwareAssets } from '@trezor/connect-data';
import connectDataCoinsEth from '@trezor/connect-data/files/coins-eth.json';
import connectDataCoins from '@trezor/connect-data/files/coins.json';
import type { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import type { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';

export class HttpRequestError extends Error {
    response: Response;

    constructor(response: Response) {
        const message = `${response.status} while fetching ${response.url}`;
        super(message);
        this.response = response;
    }
}

const getReleaseAssets = (deviceModel: DeviceModelInternal, firmwareType: FirmwareType) => {
    const firmwareTypeInFileName =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';
    const deviceModelLower = deviceModel.toLowerCase();

    return firmwareAssets?.[deviceModelLower]?.[firmwareTypeInFileName] ?? {};
};

export const getReleasesAssetByDeviceModelAndFirmwareType = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
): FirmwareRelease[] =>
    Object.values(getReleaseAssets(deviceModel, firmwareType)).sort((a, b) =>
        versionUtils.isNewer(b.version, a.version) ? 1 : -1,
    );

export const getReleaseAsset = (
    deviceModel: DeviceModelInternal,
    version: VersionArray,
    firmwareType: FirmwareType,
) =>
    getReleaseAssets(deviceModel, firmwareType)[
        `${deviceModel.toLowerCase()}-${version.join('.')}-${firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal'}`
    ] as FirmwareRelease;

export const tryLocalAssetRequire = (url: string): unknown => {
    const fileUrl = url.split('?')[0];

    switch (fileUrl) {
        case './data/coins.json':
            return connectDataCoins;
        case './data/coins-eth.json':
            return connectDataCoinsEth;
    }

    return null;
};

/**
 * Http request wrapper for Suite Web & Desktop to handle various response states in a unified way.
 */
export const httpRequest = async <T extends HttpRequestType>(
    url: string,
    type: T = 'text' as T,
    options?: HttpRequestOptions,
): Promise<HttpRequestReturnType<T>> => {
    const init: RequestInit = { ...options, credentials: 'same-origin' };

    const response = await fetch(url, init);
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();

            return JSON.parse(txt) as HttpRequestReturnType<T>;
        }
        if (type === 'binary') {
            return response.arrayBuffer() as Promise<HttpRequestReturnType<T>>;
        }

        return response.text() as Promise<HttpRequestReturnType<T>>;
    }

    throw new HttpRequestError(response);
};
