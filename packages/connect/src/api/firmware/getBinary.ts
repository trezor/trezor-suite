import type { FirmwareRelease } from '@trezor/device-utils';
import { removeTrailingSlashes } from '@trezor/utils';

import { httpRequest } from '../../utils/assets';

interface GetBinaryProps {
    baseUrl: string;
    btcOnly?: boolean;
    release: FirmwareRelease;
}

export const getBinary = ({ baseUrl, btcOnly, release }: GetBinaryProps) => {
    const fwUrl = release[btcOnly ? 'url_bitcoinonly' : 'url'];
    const sanitizedBaseUrl = removeTrailingSlashes(baseUrl);
    const url = `${sanitizedBaseUrl}/${fwUrl}`;

    return httpRequest(url, 'binary');
};

export const getBinaryOptional = async (props: GetBinaryProps) => {
    try {
        return await getBinary(props);
    } catch {
        return null;
    }
};
