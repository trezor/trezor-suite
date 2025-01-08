import tls from 'tls';

import { InterceptorContext, isWhitelistedHost } from './interceptorTypesAndUtils';

export const interceptTlsConnect = (context: InterceptorContext) => {
    const originalTlsConnect = tls.connect;

    tls.connect = (...args) => {
        const [options] = args;
        if (typeof options === 'object') {
            context.handler({
                type: 'INTERCEPTED_REQUEST',
                method: 'tls.connect',
                details: options.host || options.servername || 'unknown',
            });

            // allow untrusted/self-signed certificates for whitelisted domains (like https://*.sldev.cz)
            options.rejectUnauthorized =
                options.rejectUnauthorized ??
                !isWhitelistedHost(options.host, context.notRequiredTorDomainsList);
        }

        return originalTlsConnect(...(args as Parameters<typeof tls.connect>));
    };
};
