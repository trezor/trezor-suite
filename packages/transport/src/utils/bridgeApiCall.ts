import { success, error, unknownError } from './result';

import * as ERRORS from '../errors';

import { PROTOCOL_MALFORMED } from '@trezor/protocol';
import { applyContentTypeHeader } from './applyContentTypeHeader';

export type HttpRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
    method: 'POST' | 'GET';
    skipContentTypeHeader?: boolean;
    signal?: AbortSignal;
    timeout?: number;
};

const IS_NODE = typeof process !== 'undefined' && typeof window === 'undefined';

function contentType(body: string | unknown) {
    if (typeof body === 'string') {
        if (body === '') {
            return 'text/plain';
        }
        return 'application/octet-stream';
    }
    return 'application/json';
}

function wrapBody(body: unknown) {
    if (typeof body === 'string') {
        return body;
    }
    return JSON.stringify(body);
}

function parseResult(text: string): Record<string, unknown> | string {
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

export async function bridgeApiCall(options: HttpRequestOptions) {
    const fetchOptions = {
        method: options.method,
        body: wrapBody(options.body),
        credentials: 'same-origin' as const,
        headers: {},
        signal: options.signal,
        timeout: options.timeout,
    };

    fetchOptions.headers = applyContentTypeHeader({
        headers: fetchOptions.headers,
        contentType: contentType(options.body == null ? '' : options.body),
        skipContentTypeHeader: options.skipContentTypeHeader,
    });

    // Node applications must spoof origin for bridge CORS
    if (IS_NODE) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            Origin: 'https://node.trezor.io',
        };
    }

    let res: Response;
    try {
        res = await fetch(options.url, fetchOptions);
    } catch (err) {
        return error({ error: ERRORS.HTTP_ERROR, message: err.message });
    }

    let resParsed: Record<string, unknown> | string;
    try {
        resParsed = await res.text();
        resParsed = parseResult(resParsed);
    } catch (err) {
        return error({ error: ERRORS.HTTP_ERROR, message: err.message });
    }

    const BRIDGE_ERROR_DEVICE_CLOSED = 'closed device' as const;
    // https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/wire/protobuf.go#L14
    const BRIDGE_MALFORMED_PROTOBUF = 'malformed protobuf' as const;
    // https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/wire/v1.go#L72
    const BRIDGE_MALFORMED_WIRE_FORMAT = 'malformed wire format' as const;

    // if status is not 200. response should be interpreted as error.
    if (!res.ok) {
        const errStr =
            typeof resParsed !== 'string' && 'error' in resParsed
                ? (resParsed.error as string)
                : (resParsed as string);

        if (errStr === BRIDGE_ERROR_DEVICE_CLOSED) {
            return error({ error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
        }
        if (errStr === BRIDGE_MALFORMED_PROTOBUF) {
            return error({ error: PROTOCOL_MALFORMED });
        }
        if (errStr === BRIDGE_MALFORMED_WIRE_FORMAT) {
            return error({ error: PROTOCOL_MALFORMED });
        }
        return unknownError(new Error(errStr), [
            ERRORS.DEVICE_NOT_FOUND,
            ERRORS.HTTP_ERROR,
            ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
            ERRORS.OTHER_CALL_IN_PROGRESS,
            ERRORS.SESSION_NOT_FOUND,
            ERRORS.SESSION_WRONG_PREVIOUS,
            // todo: list more errors from trezor-d. all can occur on this level!
        ]);
    }

    return success(resParsed);
}
