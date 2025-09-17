export const requestInit: RequestInit = {
    // React native app must explicitly specify the user agent (otherwise it fails with 403)
    headers: {
        'User-Agent': 'Trezor Suite',
    },
};

export const fetchUrl = (url: string, init?: RequestInit) => {
    const combinedHeaders = {
        ...(requestInit.headers ?? {}),
        ...(init?.headers ?? {}),
    };

    const newInit: RequestInit = {
        ...requestInit,
        ...init,
        headers: combinedHeaders,
    };

    return fetch(url, newInit);
};
