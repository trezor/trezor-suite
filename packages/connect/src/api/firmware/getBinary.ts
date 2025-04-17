import { httpRequest } from '../../utils/assets';

const ALL_SLASHES_AT_THE_END_REGEX = /\/+$/;

interface GetBinaryParams {
    baseUrl: string;
    firmwareName: string;
}

export const getLocalBinary = ({ basePath, firmwareName }: any) => {
    console.log('getLocalBinary');
    console.log('basePath', basePath);
    console.log('firmwareName', firmwareName);
    const sanitizedBasePath = basePath.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
    const path = `${sanitizedBasePath}/${firmwareName}`;

    return httpRequest(path, 'binary');
};

export const getRemoteBinary = ({ firmwareUrl }: any) => {
    const baseUrl = 'https://data.trezor.io/';
    const sanitizedBaseUrl = baseUrl.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
    const url = `${sanitizedBaseUrl}/${firmwareUrl}`;

    return httpRequest(url, 'binary');
};

export const getBinary = ({ baseUrl, firmwareName }: GetBinaryParams) => {
    const sanitizedBaseUrl = baseUrl.replace(ALL_SLASHES_AT_THE_END_REGEX, '');
    const url = `${sanitizedBaseUrl}/${firmwareName}`;

    return httpRequest(url, 'binary');
};

export const getBinaryOptional = async (params: GetBinaryParams) => {
    console.log('getBinaryOptional');
    console.log('params', params);
    try {
        return await getBinary(params);
    } catch {
        return null;
    }
};
