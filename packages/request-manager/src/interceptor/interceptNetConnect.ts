import net from 'net';

import { Interceptor } from './interceptorTypes';

export const interceptNetConnect: Interceptor = ({ context, validateRequest }) => {
    const originalConnect = net.connect;

    net.connect = function (...args) {
        const [options, callback] = args;

        let details: string;
        let hostname: string;

        if (typeof options === 'object') {
            // case: connect(options: NetConnectOpts, connectionListener?: () => void): Socket;
            if ('port' in options) {
                // TcpNetConnectOpts
                details = `${options.host}:${options.port}`;
                hostname = options.host ?? '';
            } else {
                // IpcNetConnectOpts
                details = options.path;
                hostname = options.path;
            }
        } else if (typeof options === 'string') {
            // case: connect(path: string, connectionListener?: () => void): Socket;
            details = options;
            hostname = options;
        } else {
            // case connect(port: number, host?: string, connectionListener?: () => void): Socket;
            details = typeof callback === 'string' ? `${callback}:${options}` : options.toString();
            hostname = typeof callback === 'string' ? callback : options.toString();
        }

        validateRequest({ hostname });

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.connect',
            details,
        });

        return originalConnect.apply(this, args as Parameters<typeof net.connect>);
    };
};
