import { VersionArray } from '@trezor/device-utils';
import { removeTrailingSlashes } from '@trezor/utils';

import { parseFirmwareHeaders } from './parseFirmwareHeaders';
import { ERRORS } from '../../constants';
import { httpRequest } from '../../utils/assets';

interface GetBinaryParams {
    baseUrl: string;
    path: string;
    version: VersionArray;
}

export const getBinary = async ({ baseUrl, path, version }: GetBinaryParams) => {
    const sanitizedBaseUrl = removeTrailingSlashes(baseUrl);
    const url = `${sanitizedBaseUrl}/${path}`;

    const res = await httpRequest(url, 'binary');
    // suspiciously small binary. this typically happens when build does not have git lfs enabled and all
    // you download here are some pointers to lfs objects which are around ~132 byteLength
    if (res.byteLength < 200) {
        throw ERRORS.TypedError('Runtime', 'Firmware binary is too small');
    }

    return {
        binary: res,
        binaryVersion: parseFirmwareHeaders(Buffer.from(res)).version,
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
