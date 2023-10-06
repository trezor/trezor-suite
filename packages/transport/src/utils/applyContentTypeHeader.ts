export function applyContentTypeHeader({
    headers,
    contentType,
    skipContentTypeHeader,
}: {
    headers: object;
    contentType: string;
    skipContentTypeHeader?: boolean;
}) {
    if (skipContentTypeHeader) return headers;

    return {
        ...headers,
        'Content-Type': contentType,
    };
}
