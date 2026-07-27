import http from 'http';
import type https from 'https';

import { type Interceptor } from './interceptorTypes';
import { overloadHttpRequest } from './overloadHttpRequest';
import { overloadWebsocketHandshake } from './overloadWebsocketHandshake';

export const interceptHttp: Interceptor = ({ context, validateRequest }) => {
    const originalHttpRequest = http.request;

    http.request = (...args) => {
        const [url, options, callback] = args;

        const overload = overloadHttpRequest({
            context,
            protocol: 'http',
            url,
            options,
            callback,
            validateRequest,
        });

        if (overload) {
            const { identity, requestArgs } = overload;

            return context.requestPool(
                (originalHttpRequest as (...a: typeof requestArgs) => http.ClientRequest)(
                    ...requestArgs,
                ),
                identity,
            );
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpRequest(...(args as Parameters<typeof http.request>));
    };

    const originalHttpGet = http.get;

    http.get = (...args) => {
        const [url, options, callback] = args;

        const overload = overloadWebsocketHandshake({
            context,
            protocol: 'http',
            url,
            options,
            callback,
            validateRequest,
        });

        if (overload) {
            const { identity, requestArgs } = overload;

            return context.requestPool(
                (originalHttpGet as (...a: typeof requestArgs) => http.ClientRequest)(
                    ...requestArgs,
                ),
                identity,
            );
        }

        return originalHttpGet(...(args as Parameters<typeof https.get>));
    };
};
