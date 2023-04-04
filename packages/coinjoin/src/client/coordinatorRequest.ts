import { scheduleAction, enumUtils } from '@trezor/utils';

import { HTTP_REQUEST_TIMEOUT } from '../constants';
import { WabiSabiProtocolErrorCode } from '../enums';
import { httpPost, RequestOptions } from '../utils/http';

export type { RequestOptions } from '../utils/http';

export class WabiSabiProtocolException extends Error {
    type: string;
    errorCode?: WabiSabiProtocolErrorCode;
    description: string;
    exceptionData: { Type: string };

    // NOTE: coordinator/middleware error shape
    // {type: string, errorCode: string, description: string, exceptionData: { Type: string } }
    constructor(error: Record<string, any>) {
        super(error.errorCode);
        this.type = error.type;
        this.errorCode = enumUtils.getValueByKey(WabiSabiProtocolErrorCode, error.errorCode);
        this.description = error.description;
        this.exceptionData = error.exceptionData;
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
    body: Record<string, any>,
    options: RequestOptions = {},
): Promise<R> => {
    const baseUrl = options.baseUrl || '';

    const switchIdentity = () => {
        if (options.identity) {
            // set random password to reset TOR circuit for this identity and then try again
            const [user] = options.identity.split(':');
            options.identity = `${user}:${Math.random()}`;
        }
    };

    const request = async (signal?: AbortSignal) => {
        let response;
        try {
            response = await httpPost(`${baseUrl}${url}`, body, { ...options, signal });
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
            // log to app console and sentry if possible
            console.error(`Unexpected error ${response.status} request to ${url}`);
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        return { response, text };
    };

    const { response, text, error } = await scheduleAction(request, {
        timeout: HTTP_REQUEST_TIMEOUT, // allow timeout override by options
        ...options,
    });

    if (error) {
        throw error;
    }

    const result = parseResult(response.headers, text);
    if (response.ok) {
        return result;
    }

    // catch WabiSabiProtocolException
    if (typeof result === 'object' && 'errorCode' in result) {
        throw new WabiSabiProtocolException(result);
    }

    // fallback error
    const message = text ? `${response.statusText}: ${text}` : response.statusText;
    throw new Error(`${baseUrl}${url} ${message}`);
};
