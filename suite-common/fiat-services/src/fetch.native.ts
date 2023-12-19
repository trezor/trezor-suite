export const requestInit: RequestInit = {
    // React native app must explicitly specify the user agent (otherwise it fails with 403)
    headers: {
        'User-Agent': 'Trezor Suite',
    },
};

export const fetchUrl = (url: string, init?: RequestInit) =>
    fetch(url, { ...requestInit, ...init });
