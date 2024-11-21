import { httpRequest } from '../../utils/assets';
import { FirmwareRelease } from '../../types';

const ALL_SLASHES_AT_THE_END_REGEX = /\/+$/;

interface GetBinaryProps {
    baseUrl: string;
    btcOnly?: boolean;
    release: FirmwareRelease;
}

export const getBinary = ({ baseUrl, btcOnly, release }: GetBinaryProps) => {
    const fwUrl = release[btcOnly ? 'url_bitcoinonly' : 'url'];
    const sanitizedBaseUrl = baseUrl.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
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
