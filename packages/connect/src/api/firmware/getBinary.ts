import { httpRequest } from '../../utils/assets';
import { FirmwareRelease } from '../../types';

interface GetBinaryProps {
    baseUrl: string;
    btcOnly?: boolean;
    release: FirmwareRelease;
}

export const getBinary = ({ baseUrl, btcOnly, release }: GetBinaryProps) => {
    const fwUrl = release[btcOnly ? 'url_bitcoinonly' : 'url'];
    const url = `${baseUrl}/${fwUrl}`;

    return httpRequest(url, 'binary');
};
