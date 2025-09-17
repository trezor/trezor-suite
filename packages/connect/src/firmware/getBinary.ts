import { FirmwareType, VersionArray } from '@trezor/device-utils';
import { Log, removeTrailingSlashes } from '@trezor/utils';

import { parseFirmwareHeaders } from './parseFirmwareHeaders';
import { ERRORS } from '../constants';
import { FirmwareUpdateParams } from './types';
import { getFirmwareLocation, getReleaseByVersion } from '../data/firmwareInfo';
import type { Device } from '../device/Device';
import { BinaryInfo } from '../types';
import { httpRequest } from '../utils/assets';

const MIN_FIRMWARE_SIZE_BYTES = 200;

interface GetBinaryParams {
    baseUrl: string;
    path: string;
    version: VersionArray;
}

export const getBinary = async ({
    baseUrl,
    path,
    version,
}: GetBinaryParams): Promise<BinaryInfo> => {
    const sanitizedBaseUrl = removeTrailingSlashes(baseUrl);
    const url = `${sanitizedBaseUrl}/${path}`;

    const binaryArrayBuffer = (await httpRequest(url, 'binary')) as ArrayBuffer;
    // suspiciously small binary. this typically happens when build does not have git lfs enabled and all
    // you download here are some pointers to lfs objects which are around ~132 byteLength
    if (binaryArrayBuffer.byteLength < MIN_FIRMWARE_SIZE_BYTES) {
        throw ERRORS.TypedError('Runtime', 'Firmware binary is too small');
    }

    const firmwareBuffer = Buffer.from(binaryArrayBuffer);
    const { version: binaryVersion } = parseFirmwareHeaders(firmwareBuffer);

    return {
        binary: binaryArrayBuffer,
        binaryVersion,
        releaseVersion: version,
    };
};

// Used in checkFirmwareHash
export const getBinaryOptional = async (params: GetBinaryParams) => {
    try {
        return await getBinary(params);
    } catch {
        return null;
    }
};

type BinaryHelperParams = {
    device: Device;
    params: FirmwareUpdateParams;
    firmwareType: FirmwareType;
    isIntermediary: boolean;
    log: Log;
};

// Used in onCallFirmwareUpdate
export const getBinaryHelper = async ({
    device,
    params,
    firmwareType,
    isIntermediary,
    log,
}: BinaryHelperParams): Promise<BinaryInfo> => {
    if (params.binary) {
        return Promise.resolve({
            binary: params.binary,
            binaryVersion: parseFirmwareHeaders(Buffer.from(params.binary)).version,
            releaseVersion: undefined,
        });
    }

    if (!device.firmwareReleaseConfigInfo) {
        throw ERRORS.TypedError('Runtime', 'device.firmwareReleaseConfigInfo is not set');
    }
    const deviceModel = device.features?.internal_model;

    const {
        release: { version },
        intermediary,
    } = device.firmwareReleaseConfigInfo;
    log.debug(
        'onCallFirmwareUpdate loading binary',
        'isIntermediary',
        isIntermediary,
        'version',
        version,
        'firmwareType',
        firmwareType,
        'deviceModel',
        deviceModel,
    );

    // We want to get the path url to the release from the specific release we want, in `firmwareReleaseConfigInfo`
    // we have only information about latest release of current FirmwareType but if we want to change from
    // Universal to BitcoinOnly then using url from `firmwareReleaseConfigInfo` would not work.
    const release = await getReleaseByVersion(device.features, version, firmwareType);
    if (!release) {
        throw new Error('Missing Firmware release for device');
    }
    const { baseUrl, path } = getFirmwareLocation({
        firmwareVersion: version,
        remotePath: release.url,
        deviceModel,
        firmwareType,
        intermediaryVersion: isIntermediary && intermediary ? intermediary.version : undefined,
    });

    return getBinary({ baseUrl, path, version });
};
