import * as http from 'http';
import * as net from 'net';
import * as url from 'url';

import type { RequiredKey } from '@trezor/type-utils';
import { Log, TypedEmitter } from '@trezor/utils';
import { arrayPartition } from '@trezor/utils';

import { getFreePort } from './getFreePort';

type Request = RequiredKey<http.IncomingMessage, 'url'>;
type EventMap = { [event: string]: any };

export type RequestWithParams<B = unknown, P = unknown> = Request & {
    params: P;
    body: B;
};

export type Response = http.ServerResponse;

type NextHandler<Body = unknown, Params = unknown> = (
    request: RequestWithParams<Body, Params>,
    response: http.ServerResponse,
) => void;

export type RequestHandler<CurrentBody, NextBody, CurrentParams = unknown, NextParams = unknown> = (
    request: RequestWithParams<CurrentBody, CurrentParams>,
    response: Response,
    next: NextHandler<NextBody, NextParams>,
    { logger }: { logger: Log },
) => void;

type AnyRequestHandler = RequestHandler<any, any, any, any>;

type FirstHandler<T extends unknown[]> = T extends readonly [infer First, ...unknown[]]
    ? First
    : RequestHandler<unknown, unknown, unknown, unknown>;

type LastHandler<T extends unknown[]> = T extends readonly [...unknown[], infer Last]
    ? Last
    : RequestHandler<unknown, unknown, unknown, unknown>;

export type ParamsValidatorHandler<Valid extends Record<string, any>> = RequestHandler<
    unknown,
    unknown,
    Record<string, unknown>,
    Valid
>;

type UnwrapHandler<Handler, Field extends keyof RequestWithParams<any, any>> = Handler extends (
    ...args: any[]
) => any
    ? Parameters<Handler>[0] extends RequestWithParams<any, any>
        ? Parameters<Handler>[0][Field]
        : never
    : never;

type ResolveHandler<First, Last> = Last extends (...args: any[]) => any
    ? First extends ParamsValidatorHandler<Record<string, any>>
        ? (
              req: Parameters<Last>[2] & {
                  params: UnwrapHandler<Parameters<First>[2], 'params'>;
                  body: UnwrapHandler<Parameters<Last>[2], 'body'>;
              },
              res: Parameters<Last>[1],
          ) => void
        : Parameters<Last>[2]
    : [unknown, unknown];

type Route = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | '*';
    pathname: string;
    params: string[];
    handler: AnyRequestHandler[];
};
/**
 * Events that may be emitted or listened to by HttpServer
 */
type BaseEvents = {
    'server/listening': (address: NonNullable<net.AddressInfo>) => void;
    'server/closing': () => void;
    'server/closed': () => void;
    'server/error': (error: string) => void;
};

/**
 * Http server listening on localhost.
 */
export class HttpServer<T extends EventMap> extends TypedEmitter<T & BaseEvents> {
    public server: http.Server;
    public logger: Log;
    private routes: Route[] = [];
    private readonly emitter: TypedEmitter<BaseEvents> = this;
    private port?: number;
    private sockets: Record<number, net.Socket> = {};

    constructor({ logger, port }: { logger: Log; port?: number }) {
        super();

        this.port = port;

        this.logger = logger;
        this.server = http.createServer(this.onRequest);
    }

    get logName() {
        return `http: ${this.port || 'unknown port'}`;
    }

    public getServerAddress() {
        const address = this.server.address();
        if (!address || typeof address === 'string') {
            // this is only for typescript
            // net.AddressInfo may also be string for a server listening on a pipe or Unix domain socket, the name is returned as a string.
            throw new Error(`Unexpected server address: ${address}`);
        }

        return address;
    }

    getRouteAddress(pathname: string) {
        const address = this.getServerAddress();
        const route = this.routes.find(r => r.pathname === pathname);
        if (!route) return;

        return `http://${address.address}:${address.port}${route.pathname}`;
    }

    public getInfo() {
        const address = this.getServerAddress();

        return {
            url: `http://${address.address}:${address.port}`,
        };
    }

    public async start() {
        const port = this.port || (this.port = await getFreePort());

        return new Promise<net.AddressInfo>((resolve, reject) => {
            let nextSocketId = 0;
            this.server.on('connection', socket => {
                // Add a newly connected socket
                const socketId = nextSocketId++;
                this.sockets[socketId] = socket;
                // Remove the socket when it closes
                socket.on('close', () => {
                    delete this.sockets[socketId];
                });
            });

            this.server.on('error', e => {
                this.server.close();
                // @ts-expect-error - type is missing
                const errorCode: string = e.code;

                const errorMessage =
                    errorCode === 'EADDRINUSE' || errorCode === 'EACCES'
                        ? `Port ${port} already in use!` // TODO: Try different port?
                        : `Start error code: ${errorCode}`;

                this.logger.error(errorMessage);

                return reject(new Error(`http-receiver: ${errorMessage}`));
            });

            this.server.listen(port, '127.0.0.1', undefined, () => {
                this.logger.info('Server started');
                const address = this.getServerAddress();
                if (address) {
                    this.emitter.emit('server/listening', address);
                }

                return resolve(address);
            });
        });
    }

    public stop() {
        // note that this method only stops listening but keeps existing connections open and thus port blocked
        this.emitter.removeAllListeners();

        return new Promise<void>(resolve => {
            this.emitter.emit('server/closing');
            this.server.closeAllConnections();
            this.server.close(err => {
                if (err) {
                    this.logger.info('trying to close server which was not running');
                }
                this.logger.info('Server stopped');
                this.emitter.emit('server/closed');
                resolve();
            });
            Object.values(this.sockets).forEach(socket => {
                socket.destroy();
            });
        });
    }

    /**
     * split /a/:b/:c
     * to [a] and [:b, :c]
     */
    private splitSegments(pathname: string) {
        const [baseSegments, paramsSegments] = arrayPartition(
            pathname.split('/').filter(segment => segment),
            segment => !segment.includes(':'),
        );

        return [baseSegments, paramsSegments];
    }

    private registerRoute(pathname: string, method: 'POST' | 'GET', handler: AnyRequestHandler[]) {
        const [baseSegments, paramsSegments] = this.splitSegments(pathname);
        const basePathname = baseSegments.join('/');
        this.routes.push({
            method,
            pathname: `/${basePathname}`,
            params: paramsSegments,
            handler,
        });
    }

    public post<R extends AnyRequestHandler[]>(
        pathname: string,
        handler: [...R, ResolveHandler<FirstHandler<R>, LastHandler<R>>],
    ) {
        this.registerRoute(pathname, 'POST', handler);
    }

    public get(pathname: string, handler: AnyRequestHandler[]) {
        this.registerRoute(pathname, 'GET', handler);
    }

    // PUT, DELETE etc are not used anywhere in our codebase, so no need to implement them now

    /**
     * Register common handlers that are run for all requests before route handlers
     */
    public use(handler: AnyRequestHandler[]) {
        this.routes.push({
            method: '*',
            pathname: '*',
            handler,
            params: [],
        });
    }

    /**
     * pathname could be /a/b/c/d
     * return route with highest number of matching segments
     */
    private findBestMatchingRoute = (pathname: string, method = 'GET') => {
        const segments = pathname.split('/').map(segment => segment || '/');
        const routes = this.routes.filter(r => r.method === method || r.method === '*');
        const match = routes.reduce(
            (acc, route) => {
                // todo:
                // Is it necessary to split the path when registering, then join it for storing, and splitting again everytime when finding the best one?
                // Also, when stored segment-by-segment, it would be possible to represent it as a tree instead of iterating over an array.
                const routeSegments = route.pathname.split('/').map(segment => segment || '/');
                const matchedSegments = segments.filter(
                    (segment, index) => segment === routeSegments[index],
                );
                if (matchedSegments.length > acc.matchedSegments.length) {
                    return { route, matchedSegments };
                }

                return acc;
            },
            { route: undefined as Route | undefined, matchedSegments: [] as string[] },
        );

        return match.route;
    };
    /**
     * Entry point for handling requests
     */
    private onRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        // mostly ts stuff. request should always have url defined.
        if (!request.url) {
            this.logger.warn('Unexpected incoming message (no url)');
            this.emitter.emit('server/error', 'Unexpected incoming message');

            return;
        }

        request.on('aborted', () => {
            this.logger.info(`Request ${request.method} ${request.url} aborted`);
        });

        const { pathname } = url.parse(request.url, true);
        if (!pathname) {
            const msg = `url ${request.url} could not be parsed`;
            this.emitter.emit('server/error', msg);
            this.logger.warn(msg);

            return;
        }
        this.logger.info(`Handling request for ${request.method} ${pathname}`);

        const route = this.findBestMatchingRoute(pathname, request.method);
        if (!route) {
            this.emitter.emit('server/error', `Route not found for ${request.method} ${pathname}`);
            this.logger.warn(`Route not found for ${request.method} ${pathname}`);

            return;
        }

        if (!route.handler.length) {
            this.emitter.emit('server/error', `No handlers registered for route ${pathname}`);
            this.logger.warn(`No handlers registered for route ${pathname}`);

            return;
        }
        const paramsSegments = pathname
            .replace(route.pathname, '')
            .split('/')
            .filter(segment => segment);

        const requestWithParams = request as RequestWithParams;
        requestWithParams.params = route.params.reduce(
            (acc, param, index) => {
                acc[param.replace(':', '')] = paramsSegments[index];

                return acc;
            },
            {} as Record<string, string>,
        );

        const handlers = [
            ...this.routes
                .filter(r => r.method === '*' && r.pathname === '*')
                .flatMap(r => r.handler),
            ...route.handler,
        ];

        const run =
            ([handler, ...rest]: AnyRequestHandler[]) =>
            (req: RequestWithParams, res: http.ServerResponse) =>
                handler?.(req, res, run(rest), { logger: this.logger });
        run(handlers)(requestWithParams, response);
    };
}

const checkOrigin = ({
    request,
    allowedOrigin,
    pathname,
    logger,
}: {
    request: Request;
    allowedOrigin: string[];
    pathname: string;
    logger: Log;
}) => {
    const { origin } = request.headers;
    const origins = allowedOrigin ?? [];
    let isOriginAllowed = false;
    // Allow all origins
    if (origins.includes('*')) {
        isOriginAllowed = true;
    }

    if (origin) {
        isOriginAllowed = origins.some(o => {
            // match from the end to allow subdomains
            return new URL(origin).hostname.endsWith(new URL(o).hostname);
        });
    }
    if (!isOriginAllowed) {
        logger.warn(`Origin rejected for ${pathname}`);
        logger.warn(`- Received: origin: '${origin}'`);
        logger.warn(`- Allowed origins: ${origins.map(o => `'${o}'`).join(', ')}`);

        return false;
    }

    return true;
};

const checkReferer = ({
    request,
    allowedReferer,
    pathname,
    logger,
}: {
    request: Request;
    allowedReferer: string[];
    pathname: string;
    logger: Log;
}) => {
    const { referer } = request.headers;
    const referers = allowedReferer ?? [];
    let isRefererAllowed = false;
    // Allow all origins
    if (referers.includes('*')) {
        isRefererAllowed = true;
    }

    // If referer is not defined, check if empty referrers are allowed
    else if (referer === undefined) {
        isRefererAllowed = referers.includes('');
    } else {
        // Domain of referer has to be in the allowed origins for that endpoint
        let domain: string;
        try {
            domain = new URL(referer).hostname;
        } catch (err) {
            logger.warn(`Invalid referer ${referer}`);

            return false;
        }

        return (
            referers.findIndex(r => {
                // Wildcard for subdomains
                if (r.startsWith('*')) {
                    return domain.endsWith(r.substring(1));
                }

                return r.includes(domain);
            }) > -1
        );
    }

    if (!isRefererAllowed) {
        logger.warn(`Referer rejected for ${pathname}`);
        logger.warn(`- Received: referer: '${referer}', origin: '${origin}'`);
        logger.warn(`- Allowed referers: ${referers.map(o => `'${o}'`).join(', ')}`);

        return false;
    }

    return true;
};

/**
 * Built-middleware "allow origin"
 */
export const allowOrigins =
    (allowedOrigin: string[]): AnyRequestHandler =>
    (request, _response, next, { logger }) => {
        if (
            checkOrigin({
                request,
                allowedOrigin,
                pathname: request.url,
                logger,
            })
        ) {
            next(request, _response);
        }
    };

/**
 * Built-middleware "allow referers"
 */
export const allowReferers =
    (allowedReferer: string[]): AnyRequestHandler =>
    (request, _response, next, { logger }) => {
        if (
            checkReferer({
                request,
                allowedReferer,
                pathname: request.url,
                logger,
            })
        ) {
            next(request, _response);
        }
    };

export const parseBodyTextHelper = (request: Request) =>
    new Promise<string>(resolve => {
        const tmp: Buffer[] = [];
        request
            .on('data', chunk => {
                tmp.push(chunk);
            })
            .on('end', () => {
                const body = Buffer.concat(tmp).toString();
                // at this point, `body` has the entire request body stored in it as a string
                resolve(body);
            });
    });

/**
 * set request.body as parsed JSON
 */
export const parseBodyJSON: RequestHandler<unknown, JSON> = (request, response, next) => {
    parseBodyTextHelper(request)
        .then(body => JSON.parse(body))
        .then(body => {
            next({ ...request, body }, response);
        })
        .catch(error => {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: `Invalid json body: ${error.message}` }));
        });
};

/**
 * set request.body as string
 */
export const parseBodyText: RequestHandler<unknown, string> = (request, response, next) => {
    parseBodyTextHelper(request).then(body => {
        next({ ...request, body }, response);
    });
};
