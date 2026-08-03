/**
 * Decodes a URI component, returning `null` instead of throwing a `URIError` on
 * malformed percent-encoding (e.g. a lone `%` or `%zz`).
 *
 * `decodeURIComponent` throws synchronously on invalid input, so callers that
 * feed it untrusted strings (deeplinks, protocol-handler URIs, QR payloads)
 * must guard against it.
 */
export const safeDecodeURIComponent = (value: string): string | null => {
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
};
