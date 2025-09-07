import { VersionArray } from '@trezor/device-utils';
import { removeTrailingSlashes } from '@trezor/utils';

import { parseFirmwareHeaders } from './parseFirmwareHeaders';
import { ERRORS } from '../../constants';
import { BinaryInfo } from '../../types';
import { httpRequest } from '../../utils/assets';

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

export const getBinaryOptional = async (params: GetBinaryParams) => {
    try {
        return await getBinary(params);
    } catch {
        return null;
    }
};
