import { httpRequest } from '../../utils/assets';

const ALL_SLASHES_AT_THE_END_REGEX = /\/+$/;

interface GetBinaryParams {
    baseUrl: string;
    firmwareName: string;
}

export const getBinary = ({ baseUrl, firmwareName }: GetBinaryParams) => {
    const sanitizedBaseUrl = baseUrl.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
    const url = `${sanitizedBaseUrl}/${firmwareName}`;

    return httpRequest(url, 'binary');
};

export const getBinaryOptional = async (params: GetBinaryParams) => {
    try {
        return await getBinary(params);
    } catch {
        return null;
    }
};
