import { scheduleAction, enumUtils } from '@trezor/utils';

import { HTTP_REQUEST_TIMEOUT } from '../constants';
import { WabiSabiProtocolErrorCode } from '../enums';
import {
    httpPost,
    httpGet,
    patchResponse,
    RequestOptions,
    resetIdentityCircuit,
} from '../utils/http';

export type { RequestOptions } from '../utils/http';

export type ExceptionData =
    | {
          Type: 'InputBannedExceptionData';
          BannedUntil: string;
      }
    | { Type: string };

export class WabiSabiProtocolException extends Error {
    type: string;
    errorCode?: WabiSabiProtocolErrorCode;
    description: string;
    exceptionData: ExceptionData;

    // NOTE: coordinator/middleware error shape
    // {Type: string, ErrorCode: string, Description: string, ExceptionData: { Type: string } }
    constructor(error: Record<string, any>) {
        super(`${error.ErrorCode} ${error.Description}`);
        this.type = error.Type;
        this.errorCode = enumUtils.getValueByKey(WabiSabiProtocolErrorCode, error.ErrorCode);
        this.description = error.Description;
        this.exceptionData = error.ExceptionData;
    }
}

const parseResult = (headers: Headers, text: string) => {
    if (headers.get('content-type')?.includes('json')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // fall down and return text
        }
    }

    return text;
};

// Requests to wasabi coordinator and middleware (CoinjoinClientLibrary bin)
export const coordinatorRequest = async <R = void>(
    url: string,
    body: Record<string, any> | undefined,
    options: RequestOptions = {},
): Promise<R> => {
    const baseUrl = options.baseUrl || '';
    const requestUrl = `${baseUrl}${url}`;

    const switchIdentity = () => {
        if (options.identity) {
            options.identity = resetIdentityCircuit(options.identity);
        }
    };

    const request = async (signal?: AbortSignal) => {
        let response;
        try {
            const method = options.method === 'GET' ? httpGet : httpPost;
            response = await method(requestUrl, body, { ...options, signal });
        } catch (e) {
            // NOTE: this code probably belongs to @trezor/request-manager package since errors are tightly related to TOR
            // catch errors from:
            // - nodejs http module (by e.code) like "socket hang up" or "socket disconnected before secure TLS connection was established" (see ./node_modules/@types/node/*/http.d.ts)
            // - socks module (by e.type and e.message) like "Socks5 proxy rejected connection" or "Proxy connection timed out" (see ./node_modules/socks/build/common/constants)
            const socksErrors = ['Socks5', 'Proxy'];
            const shouldSwitchIdentity =
                ('code' in e && e.code === 'ECONNRESET') ||
                ('type' in e &&
                    e.type === 'system' &&
                    socksErrors.some(se => e.message.includes(se)));

            if (shouldSwitchIdentity) {
                switchIdentity();
            } else if (options.deadline) {
                // prevent dead cycles while using "deadline" option in scheduledAction
                // catch fetch runtime errors like ECONNREFUSED or blocked by @trezor/request-manager
                // and stop scheduledAction. those errors will not be resolved by retrying
                return { error: e as Error };
            }
            throw e;
        }

        // throw unexpected network errors => retry scheduledAction
        if (![200, 404, 500].includes(response.status)) {
            if (response.status === 403) {
                // NOTE: possibly blocked by cloudflare
                switchIdentity();
            }

            throw new Error(`${response.statusText} (${response.status})`);
        }

        const text = await response.text();

        return { response, text };
    };

    const { response, text, error } = await scheduleAction(request, {
        timeout: HTTP_REQUEST_TIMEOUT, // allow timeout override by options
        ...options,
    });

    if (error) {
        throw new Error(`${requestUrl} ${error.message}`);
    }

    const result = parseResult(response.headers, text);
    if (response.ok) {
        return result;
    }

    const protocolError = patchResponse(result);
    // catch WabiSabiProtocolException
    if (typeof protocolError === 'object' && 'ErrorCode' in protocolError) {
        throw new WabiSabiProtocolException(protocolError);
    }

    // fallback error
    const fallbackError = `${requestUrl} ${response.statusText} (${response.status})`;
    const message = text ? `${fallbackError} ${text}` : fallbackError;
    throw new Error(message);
};
