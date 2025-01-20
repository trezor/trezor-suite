import tls from 'tls';

import { isWhitelistedHost } from '@trezor/utils';

import { Interceptor } from './interceptorTypes';

export const interceptTlsConnect: Interceptor = ({ context, validateRequest }) => {
    const originalTlsConnect = tls.connect;

    tls.connect = (...args) => {
        const [optionsOrPort, optionsOrHost] = args;

        let hostname: string;

        if (typeof optionsOrPort === 'object') {
            // case: connect(options: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
            hostname = optionsOrPort.host || optionsOrPort.servername || 'unknown';

            // allow untrusted/self-signed certificates for whitelisted domains (like https://*.sldev.cz)
            optionsOrPort.rejectUnauthorized =
                optionsOrPort.rejectUnauthorized ??
                !isWhitelistedHost(optionsOrPort.host, context.notRequiredTorDomainsList);
        } else {
            if (typeof optionsOrHost === 'object') {
                // case: connect(port: number, options?: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
                hostname = optionsOrHost.host ?? '';
            } else {
                // case: connect(port: number, host?: string, options?: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
                hostname = typeof optionsOrHost === 'string' ? optionsOrHost : 'unknown';
            }
        }

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'tls.connect',
            details: hostname,
        });

        // This is here for defensive reasons, the original `tls.connect` implementation (AFAIK)
        // uses net.connect to create new socket, and it already contains the interception logic.
        // But to be 100% sure, lets do the check here as well.
        validateRequest({ hostname });

        return originalTlsConnect(...(args as Parameters<typeof tls.connect>));
    };
};
