import { base64urlnopad, utf8 } from '@scure/base';

export const splitJWS = (jws: string) => {
    const [encodedHeader, encodedPayload, encodedSignature, ...rest] = jws.split('.');

    if (
        encodedHeader === undefined ||
        encodedPayload === undefined ||
        encodedSignature === undefined ||
        rest.length > 0
    ) {
        return undefined;
    }

    return { encodedHeader, encodedPayload, encodedSignature };
};

export const decodeBase64Url = (value: string) => {
    try {
        return base64urlnopad.decode(value);
    } catch {
        return undefined;
    }
};

const decodeJSONSegment = (segment: string): unknown => {
    const bytes = decodeBase64Url(segment);
    if (!bytes) return undefined;

    try {
        return JSON.parse(utf8.encode(bytes));
    } catch {
        return undefined;
    }
};

export const decodeJWSHeader = (encodedHeader: string) => {
    const header = decodeJSONSegment(encodedHeader);

    return typeof header === 'object' && header !== null
        ? (header as Record<string, unknown>)
        : undefined;
};

export type DecodedJWS = {
    header: Record<string, unknown>;
    payload: unknown;
};

/**
 * Decodes the header and payload of a compact-serialized JWS. Does not verify the signature.
 */
export const decodeJWS = (jws: string): DecodedJWS | undefined => {
    const segments = splitJWS(jws);
    if (!segments) return undefined;

    const header = decodeJWSHeader(segments.encodedHeader);
    if (!header) return undefined;

    const payload = decodeJSONSegment(segments.encodedPayload);
    if (payload === undefined) return undefined;

    return { header, payload };
};
