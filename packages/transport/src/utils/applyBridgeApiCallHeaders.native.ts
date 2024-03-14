//Info at the beginning of the file

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
    console.log('HERE NATIVE');

    return {
        ...headers,
        'Content-Type': contentType,
        // Explain this!
        Origin: 'https://user-env.trezor.io',
    };
}
