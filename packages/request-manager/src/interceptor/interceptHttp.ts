import http from 'http';
import https from 'https';

import { Interceptor } from './interceptorTypes';
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
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpRequest(...overloadedArgs), identity);
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
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpGet(...overloadedArgs), identity);
        }

        return originalHttpGet(...(args as Parameters<typeof https.get>));
    };
};
