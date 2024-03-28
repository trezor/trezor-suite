const IS_NODE = typeof process !== 'undefined' && typeof window === 'undefined';

export function applyBridgeApiCallHeaders({
    headers,
    contentType,
    skipContentTypeHeader,
}: {
    headers: Record<string, string>;
    contentType: string;
    skipContentTypeHeader?: boolean;
}) {
    // Node applications must spoof origin for bridge CORS
    if (IS_NODE) {
        headers['Origin'] = 'https://wallet.trezor.io';
    }

    if (!skipContentTypeHeader) headers['Content-Type'] = contentType;

    return headers;
}
