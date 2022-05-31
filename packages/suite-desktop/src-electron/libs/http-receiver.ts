import * as http from 'http';
import * as net from 'net';
import * as url from 'url';
import { EventEmitter } from 'events';
import { HTTP_ORIGINS_DEFAULT } from './constants';

export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

type Request = RequiredKey<http.IncomingMessage, 'url'>;

type TemplateOptions = {
    title?: string;
};
/**
 * Events that may be emitted or listened to by HttpReceiver
 */
interface Events {
    'server/listening': (address: NonNullable<net.AddressInfo>) => void;
    'server/error': (error: string) => void;
    'oauth/response': (response: { [key: string]: string }) => void;
    'oauth/error': (message: string) => void;
    'buy/redirect': (url: string) => void;
    'sell/redirect': (url: string) => void;
    'spend/message': (event: Partial<MessageEvent>) => void;
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
        origins?: string[];
    }[];
    private logger: ILogger;

    // Possible ports
    // We need to be specific here (cant let OS automatically assign a port) because there are exact redirect uris registered within oauth providers
    // todo: add more to prevent case when port is blocked
    static PORTS = [21335];

    constructor() {
        super();

        this.routes = [
            {
                pathname: '/oauth',
                handler: this.oauthHandler,
                origins: [''], // No referer is sent by Google and Dropbox
            },
            {
                pathname: '/buy-redirect',
                handler: this.buyHandler,
                origins: ['', 'localhost:3000', '*.invity.io', 'invity.io'],
            },
            {
                pathname: '/buy-post',
                handler: this.buyPostSubmitHandler,
                origins: [''], // No referer
            },
            {
                pathname: '/sell-redirect',
                handler: this.sellHandler,
                origins: [''], // No referer
            },
            {
                pathname: '/spend-iframe',
                handler: this.spendIframeHandler,
                origins: [''], // Opened in a new tab, no referer
            },
            {
                pathname: '/spend-handle-message',
                handler: this.spendHandleMessage,
                // Default referers
            },
            /**
             * Register more routes here. Each route must have pathname and handler function.
             */
        ];
        this.server = http.createServer(this.onRequest);
        this.logger = global.logger;
    }

    getServerAddress() {
        const address = this.server.address();
        if (!address || typeof address === 'string') {
            // this is only for typescript
            // net.AddressInfo may also be string for a server listening on a pipe or Unix domain socket, the name is returned as a string.
            throw new Error(`Unexpected server address: ${address}`);
        }

        return address;
    }

    getRouteAddress(pathname: any) {
        const address = this.getServerAddress();
        const route = this.routes.find(r => r.pathname === pathname);
        if (!route) return;
        return `http://${address.address}:${address.port}${route.pathname}`;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.on('error', e => {
                // @ts-ignore - type is missing
                this.logger.error('http-receiver', `Start error code: ${e.code}`);
                // if (e.code === 'EADDRINUSE') {} // TODO: Try different port if already in use
                this.server.close();
                return reject();
            });
            this.server.listen(HttpReceiver.PORTS[0], '127.0.0.1', undefined, () => {
                this.logger.info('http-receiver', 'Server started');
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
        this.server.close(() => {
            this.logger.info('http-receiver', 'Server stopped');
        });
        this.removeAllListeners();
    }

    /**
     * Entry point for handling requests
     */
    private onRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        // mostly ts stuff. request should always have url defined.
        if (!request.url) {
            this.logger.warn('http-receiver', 'Unexpected incoming message (no url)');
            this.emit('server/error', 'Unexpected incoming message');
            return;
        }

        // only method GET is supported
        if (request.method !== 'GET') {
            this.logger.warn('http-receiver', `Incorrect method used (${request.method})`);
            return;
        }

        const { pathname } = url.parse(request.url, true);
        const route = this.routes.find(r => r.pathname === pathname);
        if (!route) {
            this.logger.warn('http-receiver', `Route not found for ${pathname}`);
            return;
        }

        const { referer } = request.headers;
        const origins = route.origins ?? HTTP_ORIGINS_DEFAULT;
        if (!this.isOriginAllowed(origins, referer)) {
            this.logger.warn('http-receiver', `Origin rejected for ${pathname}`);
            this.logger.warn('http-receiver', `- Received: '${referer}'`);
            this.logger.warn(
                'http-receiver',
                `- Allowed origins: ${origins.map(o => `'${o}'`).join(', ')}`,
            );
            return;
        }

        this.logger.info('http-receiver', `Handling request for ${pathname}`);

        response.setHeader('Content-Type', 'text/html; charset=UTF-8');
        // original type has url as optional, Request alias makes it required.
        return route.handler(request as Request, response);
    };

    private isOriginAllowed = (origins: string[], referer?: string) => {
        // Allow all origins
        if (origins.includes('*')) {
            return true;
        }

        // If referer is not define, check if empty referers are allowed
        if (referer === undefined) {
            return origins.includes('');
        }

        // Domain of referer has to be in the allowed origins for that endpoint
        const domain = new URL(referer).hostname;
        return (
            origins.findIndex(origin => {
                // Wildcard for subdomains
                if (origin.startsWith('*')) {
                    return domain.endsWith(origin.substr(1));
                }

                return origin.includes(domain);
            }) > -1
        );
    };

    // TODO: add option to auto-close after X seconds. Possible?
    private applyTemplate = (content: string, options?: TemplateOptions) => {
        const template = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${options?.title ?? 'Trezor Suite'}</title>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `;

        return template;
    };

    /**
     * Handlers sections starts here
     */

    private oauthHandler = (request: Request, response: http.ServerResponse) => {
        const { search } = url.parse(request.url, true);
        if (search) {
            // send data back to main window
            this.emit('oauth/response', { search });
        }

        const template = this.applyTemplate('You may now close this window.');
        response.end(template);
    };

    private buyHandler = (request: Request, response: http.ServerResponse) => {
        const { query } = url.parse(request.url, true);
        if (query && query.p) {
            this.emit('buy/redirect', query.p.toString());
        }

        const template = this.applyTemplate('You may now close this window.');
        response.end(template);
    };

    private sellHandler = (request: Request, response: http.ServerResponse) => {
        const { query } = url.parse(request.url, true);
        if (query && query.p) {
            this.emit('sell/redirect', query.p.toString());
        }

        const template = this.applyTemplate('You may now close this window.');
        response.end(template);
    };

    private spendIframeHandler = (_request: Request, response: http.ServerResponse) => {
        const regex = /^https:\/\/(.+\.|)bitrefill\.com$/;
        const template = `<!DOCTYPE html>
                <head>
                    <style>
                        body, html {
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            font-family: sans-serif;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                        }
                        .title {
                            font-size: 12pt;
                            color: #888;
                            margin: 20px;
                        }
                        iframe {
                            border: 1px #888 solid;
                            width: 95%;
                            height: 100%;
                            display: block;
                        }
                    </style>
                </head>
                <body>
                    <div class="title">Content of this page is provided by our partner</div>
                    <iframe
                        id="iframe"
                        title="."
                        sandbox="allow-scripts allow-forms allow-same-origin"
                        src=""
                    ></iframe>
                    <script>
                        function eventHandler(event, handleMessageEndpoint) {
                            var req = new XMLHttpRequest();
                            req.open("GET", handleMessageEndpoint + '?data=' + encodeURIComponent(event.data) + '&origin=' + event.origin);
                            req.send();
                        }
                        const urlParams = new URLSearchParams(window.location.search);
                        const iframe = document.getElementById('iframe');
                        const iframeSrc = urlParams.get('voucherSiteUrl');
                        const iframeUrl = new URL(urlParams.get('voucherSiteUrl'));
                        const origin = iframeUrl.origin;
                        const regex = ${regex};
                        if(regex.test(origin)) {
                            const handleMessageEndpoint = urlParams.get('handleMessageEndpoint');
                            iframe.src = decodeURIComponent(iframeSrc);
                            window.addEventListener('message', function(event) {
                                eventHandler(event, handleMessageEndpoint);
                            });
                        }
                    </script>
                </body>
            </html>`;
        response.end(template);
    };

    private spendHandleMessage = (request: Request, response: http.ServerResponse) => {
        const { query } = url.parse(request.url, true);
        this.emit('spend/message', {
            origin: Array.isArray(query.origin) ? query.origin.join(',') : query.origin,
            data: Array.isArray(query.data) ? query.data.join(',') : query.data,
        });

        const template = this.applyTemplate('You may now close this window.');
        response.end(template);
    };

    private buyPostSubmitHandler = (request: Request, response: http.ServerResponse) => {
        const { query } = url.parse(request.url, true);
        const action = query.a;
        const content = `
            Forwarding to ${action}...
            <form id="buy-form" method="POST" action="${action}">
            ${Object.keys(query)
                .map(q =>
                    q !== 'a' ? `<input type="hidden" name="${q}" value="${query[q]}">` : '',
                )
                .join('')}
            </form>
            <script type="text/javascript">document.getElementById("buy-form").submit();</script>
        `;

        const template = this.applyTemplate(content);
        response.end(template);
    };

    /**
     * Add your own handlers here
     */
}
