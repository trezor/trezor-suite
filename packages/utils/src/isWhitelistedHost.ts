export const isWhitelistedHost = (
    hostname: unknown,
    whitelist: string[] = ['127.0.0.1', 'localhost'],
) => {
    if (typeof hostname !== 'string') {
        return false; // Defensively block the request
    }

    if (hostname.trim() === '') {
        return false; // Defensively block the request
    }

    return whitelist.some(
        whitelistedUrl =>
            whitelistedUrl === hostname ||
            // This needs to be here to allow sub-domains (like btc.trezor.io, hoodi.trezor.io, ...,
            hostname.endsWith(`.${whitelistedUrl}`),
    );
};
