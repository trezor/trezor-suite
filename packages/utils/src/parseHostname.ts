/**
 * ^([a-z0-9.+-]+:\/\/)? - optionally starts with scheme (http://, wss://, ...)
 * ([a-z0-9.-]+) - all valid hostname characters until first slash, colon or end of line
 * ([:/][^:/]+)* - any number of sequences starting with colon (ports) or slash (path segments)
 * \/?$ - optionally ends with slash
 */
const HOSTNAME_REGEX = /^([a-z0-9.+-]+:\/\/)?([a-z0-9.-]+)([:/][^:/]+)*\/?$/i;

/**
 * Tries to parse hostname from maybe url string, with support of unconventional electrum urls.
 * @see {@link file://./../tests/parseHostname.test.ts}
 */
export const parseHostname = (url: string) => url.match(HOSTNAME_REGEX)?.[2]?.toLowerCase();
