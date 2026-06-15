const getHeaderEntries = (headers?: HeadersInit): [string, string][] => {
    if (!headers) {
        return [];
    }

    return [...new Headers(headers).entries()];
};

export const getHeaderValue = (headers: HeadersInit | undefined, name: string) => {
    if (!headers) {
        return undefined;
    }

    return new Headers(headers).get(name) ?? undefined;
};

// Internal control headers that must never reach the destination server, regardless of the
// allow-list: `Proxy-Authorization` carries the Tor identity credentials and `Allowed-Headers` is
// our own routing-control header.
const internalControlHeaders = ['proxy-authorization', 'allowed-headers'];

const isInternalControlHeader = (key: string) => internalControlHeaders.includes(key.toLowerCase());

const isHeaderAllowed = (key: string, allowedHeadersValue: string) => {
    const allowedKeys = allowedHeadersValue.split(';');
    const normalizedKey = key.toLowerCase();

    // Prefix match, case-insensitive - same semantics as the original socket-level stripping. Uses
    // `startsWith` rather than a `RegExp` so allow-list values containing regex metacharacters are
    // matched literally.
    return allowedKeys.some(allowed => normalizedKey.startsWith(allowed.toLowerCase()));
};

// Builds the headers sent through the Tor SOCKS5 dispatcher. Internal control headers are always
// stripped first so they can never leak. When `Allowed-Headers` is present only the allow-listed
// headers are then kept; otherwise all remaining headers are forwarded.
export const buildTorHeaders = (headers?: HeadersInit): Record<string, string> => {
    const entries = getHeaderEntries(headers);

    const allowedHeadersValue = getHeaderValue(headers, 'Allowed-Headers');

    const withoutControlHeaders = entries.filter(([key]) => !isInternalControlHeader(key));

    const filtered =
        allowedHeadersValue !== undefined
            ? withoutControlHeaders.filter(([key]) => isHeaderAllowed(key, allowedHeadersValue))
            : withoutControlHeaders;

    return Object.fromEntries(filtered);
};
