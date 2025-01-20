import https from 'https';

import { overloadHttpRequest } from './overloadHttpRequest';
import { overloadWebsocketHandshake } from './overloadWebsocketHandshake';
import { Interceptor } from './interceptorTypes';

export const interceptHttps: Interceptor = ({ context, validateRequest }) => {
    const originalHttpsRequest = https.request;

    https.request = (...args) => {
        const [url, options, callback] = args;

        const overload = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options,
            callback,
            validateRequest,
        });

        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpsRequest(...overloadedArgs), identity);
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpsRequest(...(args as Parameters<typeof https.request>));
    };

    const originalHttpsGet = https.get;

    https.get = (...args) => {
        const [url, options, callback] = args;

        const overload = overloadWebsocketHandshake({
            context,
            protocol: 'https',
            url,
            options,
            callback,
            validateRequest,
        });

        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpsGet(...overloadedArgs), identity);
        }

        return originalHttpsGet(...(args as Parameters<typeof https.get>));
    };
};
