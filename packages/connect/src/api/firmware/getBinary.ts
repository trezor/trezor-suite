import { FirmwareRelease } from '../../types';
import { httpRequest } from '../../utils/assets';

const ALL_SLASHES_AT_THE_END_REGEX = /\/+$/;

interface GetBinaryProps {
    baseUrl: string;
    btcOnly?: boolean;
    release: FirmwareRelease;
}

export const getBinary = ({ baseUrl, btcOnly, release }: GetBinaryProps) => {
    console.log('getBinary');
    const fwUrl = release[btcOnly ? 'url_bitcoinonly' : 'url'];
    const sanitizedBaseUrl = baseUrl.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
    // TODO(karliatto): this is just a dev hack, it should probably fix differently, why the bundle releases do not contain
    const justDevFwUrl = fwUrl ? fwUrl.replace('data/', '') : '';
    console.log('sanitizedBaseUrl', sanitizedBaseUrl);
    console.log('justDevFwUrl', justDevFwUrl);
    const url = `${sanitizedBaseUrl}/${justDevFwUrl}`;

    return httpRequest(url, 'binary');
};

export const getBinaryOptional = async (props: GetBinaryProps) => {
    try {
        return await getBinary(props);
    } catch {
        return null;
    }
};
