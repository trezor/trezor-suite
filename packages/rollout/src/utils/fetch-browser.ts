import fetch from 'cross-fetch';

export const fetchFirmware = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.arrayBuffer();
};
