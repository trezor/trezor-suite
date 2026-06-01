import https from 'https';

import { type Interceptor } from './interceptorTypes';
import { overloadHttpRequest } from './overloadHttpRequest';
import { overloadWebsocketHandshake } from './overloadWebsocketHandshake';

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

            return context.requestPool(
                originalHttpsRequest(...(overloadedArgs as Parameters<typeof https.request>)),
                identity,
            );
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

            return context.requestPool(
                originalHttpsGet(...(overloadedArgs as Parameters<typeof https.get>)),
                identity,
            );
        }

        return originalHttpsGet(...(args as Parameters<typeof https.get>));
    };
};
