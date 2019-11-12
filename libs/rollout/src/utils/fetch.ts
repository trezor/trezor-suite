import fetch from 'cross-fetch';

export const fetchReleasesList = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw response.statusText;
        }
        return await response.json();
    } catch (err) {
        throw new Error(err);
    }
};

export const fetchFirmware = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw response.statusText;
        }
        return await response.arrayBuffer();
    } catch (err) {
        throw new Error(err);
    }
};
