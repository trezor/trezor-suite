export function applyBridgeApiCallHeaders({
    headers,
    contentType,
    // @ts-expect-error: On native we never want to omit the content type header,
    // because otherwise is the Android OS unable to communicate with the bridge.
    // In other words the `skipContentTypeHeader` is always ignored.
    skipContentTypeHeader,
}: {
    headers: object;
    contentType: string;
    skipContentTypeHeader?: boolean;
}) {
    return {
        ...headers,
        'Content-Type': contentType,
        // The origin header is required for direct communication with the bridge. In case that
        // this header is not equal to ".*.trezor.io" the request is forbidden.
        Origin: 'https://user-env.trezor.io',
    };
}
