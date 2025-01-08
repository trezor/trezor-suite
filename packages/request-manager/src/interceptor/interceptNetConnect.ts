import net from 'net';

import { InterceptorContext } from './interceptorTypesAndUtils';

export const interceptNetConnect = (context: InterceptorContext) => {
    const originalConnect = net.connect;

    net.connect = function (...args) {
        const [options, callback] = args;

        let details: string;
        if (typeof options === 'object') {
            if ('port' in options) {
                // TcpNetConnectOpts
                details = `${options.host}:${options.port}`;
            } else {
                // IpcNetConnectOpts
                details = options.path;
            }
        } else if (typeof options === 'string') {
            details = options;
        } else {
            details = typeof callback === 'string' ? `${callback}:${options}` : options.toString();
        }

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.connect',
            details,
        });

        return originalConnect.apply(this, args as Parameters<typeof net.connect>);
    };
};
