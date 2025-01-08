import https from 'https';

import { InterceptorContext } from './interceptorTypesAndUtils';
import { overloadHttpRequest } from './overloadHttpRequest';
import { overloadWebsocketHandshake } from './overloadWebsocketHandshake';

export const interceptHttps = (context: InterceptorContext) => {
    const originalHttpsRequest = https.request;

    https.request = (...args) => {
        const overload = overloadHttpRequest(context, 'https', ...args);
        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpsRequest(...overloadedArgs), identity);
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpsRequest(...(args as Parameters<typeof https.request>));
    };

    const originalHttpsGet = https.get;

    https.get = (...args) => {
        const overload = overloadWebsocketHandshake(context, 'https', ...args);
        if (overload) {
            const [identity, ...overloadedArgs] = overload;

            return context.requestPool(originalHttpsGet(...overloadedArgs), identity);
        }

        return originalHttpsGet(...(args as Parameters<typeof https.get>));
    };
};
