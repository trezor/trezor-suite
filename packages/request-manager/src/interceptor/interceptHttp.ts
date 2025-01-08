import http from 'http';
import https from 'https';

import { InterceptorContext } from './interceptorTypesAndUtils';
import { overloadHttpRequest } from './overloadHttpRequest';
import { overloadWebsocketHandshake } from './overloadWebsocketHandshake';

export const interceptHttp = (context: InterceptorContext) => {
    const originalHttpRequest = http.request;

    http.request = (...args) => {
        const overload = overloadHttpRequest(context, 'http', ...args);
        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpRequest(...overloadedArgs), identity);
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpRequest(...(args as Parameters<typeof http.request>));
    };

    const originalHttpGet = http.get;

    http.get = (...args) => {
        const overload = overloadWebsocketHandshake(context, 'http', ...args);
        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpGet(...overloadedArgs), identity);
        }

        return originalHttpGet(...(args as Parameters<typeof https.get>));
    };
};
