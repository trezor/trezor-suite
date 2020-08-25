import * as http from 'http';
import * as net from 'net';
import * as url from 'url';
import { EventEmitter } from 'events';

export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

type Request = RequiredKey<http.IncomingMessage, 'url'>;

/**
 * Events that may be emitted or listened to by HttpReceiver
 */
interface Events {
    'server/listening': (address: NonNullable<net.AddressInfo>) => void;
    'server/error': (error: string) => void;
    'oauth/code': (code: string) => void;
    'oauth/error': (message: string) => void;
}

export declare interface HttpReceiver {
    on<U extends keyof Events>(event: U, listener: Events[U]): this;
    emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

/**
 * Http server listening on localhost.
 */
export class HttpReceiver extends EventEmitter {
    server: http.Server;
    routes: {
        pathname: string;
        handler: (request: Request, response: http.ServerResponse) => void;
    }[];

    // Possible ports
    // todo: add more to prevent case when port is blocked
    static PORTS = [21335];

    constructor() {
        super();

        this.routes = [
            {
                pathname: '/oauth',
                handler: this.oauthHandler,
            },
            /**
             * Register more routes here. Each route must have pathname and handler function.
             */
        ];
        this.server = http.createServer(this.onRequest);
    }

    getServerAddress() {
        const address = this.server.address();
        // net.AddressInfo may also be string for a server listening on a pipe or Unix domain socket, the name is returned as a string.
        if (!address || typeof address === 'string') return null;

        return address;
    }

    getRouteAddress(pathname: any) {
        const address = this.getServerAddress();
        const route = this.routes.find(r => r.pathname === pathname);
        if (!route) return;
        if (address) {
            return `http://${address.address}:${address.port}${route.pathname}`;
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.on('error', e => {
                // @ts-ignore - type is missing
                if (e.code === 'EADDRINUSE') {
                    // todo:
                }
                this.server.close();
                return reject();
            });
            this.server.listen(HttpReceiver.PORTS[0], '127.0.0.1', undefined, () => {
                const address = this.getServerAddress();
                if (address) {
                    this.emit('server/listening', address);
                }
                return resolve(address);
            });
        });
    }

    stop() {
        // note that this method only stops listening but keeps existing connections open and thus port blocked
        this.server.close();
    }

    /**
     * Entry point for handling requests
     */
    private onRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        // mostly ts stuff. request should always have url defined.
        if (!request.url) {
            this.emit('server/error', 'Unexpected incoming message');
            return;
        }

        const { pathname } = url.parse(request.url, true);

        // only method GET is supported
        if (request.method !== 'GET') {
            return;
        }

        const route = this.routes.find(r => r.pathname === pathname);
        if (route) {
            // original type has url as optional, Request alias makes it required.
            return route.handler(request as Request, response);
        }
    };

    /**
     * Handlers sections starts here
     */

    private oauthHandler = (request: Request, response: http.ServerResponse) => {
        const { query } = url.parse(request.url, true);

        // send data back to main window
        if (typeof query.code === 'string') {
            this.emit('oauth/code', query.code);
        }

        // todo: would be nice to find how to close default browser window after redirecting.
        const template = `
            <body>
                You may now close this window.
            </body>
        `;

        response.end(template);
    };

    /**
     * Add your own handlers here
     */
}
