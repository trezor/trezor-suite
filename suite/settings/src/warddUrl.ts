/**
 * Where wardd, the local WARD service, listens unless it was started with another `--port`.
 */
export const WARDD_DEFAULT_URL = 'ws://127.0.0.1:21329';

// wardd binds to this machine only. Suite sends it the pairing token and, through Connect, the
// wallet's Evolu node, so no other host may ever receive them.
const WARDD_HOSTNAMES = ['127.0.0.1', 'localhost'];

/**
 * Whether Suite may connect to wardd at this URL: plain `ws://` on this machine, without
 * credentials in the URL.
 */
export const isValidWarddUrl = (url: string): boolean => {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(url);
    } catch {
        return false;
    }

    if (parsedUrl.username !== '' || parsedUrl.password !== '') {
        return false;
    }

    return parsedUrl.protocol === 'ws:' && WARDD_HOSTNAMES.includes(parsedUrl.hostname);
};
