import { sanitizeUrl } from '@braintree/sanitize-url';
import * as http from 'http';
import type * as net from 'net';

import type { RequiredKey } from '@trezor/type-utils';
import { type Log, TypedEmitter, arrayPartition } from '@trezor/utils';

import { findProcessFromIncomingPort } from './findProcessFromIncomingPort';
import { formatRequestUrl, parseRequestUrl } from './parseRequestUrl';

type Request = RequiredKey<http.IncomingMessage, 'url'>;
const isRequest = (request: http.IncomingMessage): request is Request => request.url !== undefined;
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
    isActive: boolean;
};
/**
 * Events that may be emitted or listened to by HttpServer
 */
type BaseEvents = {
    'server/listening': NonNullable<net.AddressInfo>;
    'server/closing': void;
    'server/closed': void;
    'server/error': string;
};

/**
 * Http server listening on localhost.
 */
export class HttpServer<T extends EventMap> extends TypedEmitter<T & BaseEvents> {
    public server: http.Server;
    public logger: Log;
    private routes: Route[] = [];
    private readonly emitter: TypedEmitter<BaseEvents> = this;
    private ports: number[] = [];
    private port: number | undefined;
    private address: string;
    private sockets: Record<number, net.Socket> = {};
    private onConnection?: (socket: net.Socket) => void;
    private onError?: (e: Error) => void;

    constructor({
        logger,
        port,
        ports,
        address = '127.0.0.1',
    }: {
        logger: Log;
        port?: number;
        ports?: number[];
        address?: string;
    }) {
        super();

        if (ports && ports.length > 0) {
            this.ports = ports;
        } else if (port) {
            this.ports = [port];
        } else {
            this.ports = [0]; // this will pick a random free ports
        }

        this.logger = logger;
        this.server = http.createServer(this.onRequest);
        this.address = address;
    }

    get logName() {
        return `http: ${this.ports[0] || 'unknown port'}`;
    }

    public getServerAddress() {
        if (!this.server.listening) {
            // this happens when port was already in use at the time of starting the server
            throw new Error(`Server is not listening`);
        }
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

    public start() {
        const port = this.port || this.ports.shift();
        if (typeof port !== 'number') {
            // this should not happen
            throw new Error('There is no port available in ports array');
        }

        return new Promise<
            | { success: true; payload: net.AddressInfo }
            | {
                  success: false;
                  error: 'port already in use';
                  message: string;
              }
            | {
                  success: false;
                  error: 'other error';
                  message: string;
              }
        >(resolve => {
            let nextSocketId = 0;
            this.onConnection = socket => {
                // Add a newly connected socket
                const socketId = nextSocketId++;
                this.sockets[socketId] = socket;
                // Remove the socket when it closes
                socket.on('close', () => {
                    delete this.sockets[socketId];
                });
            };
            this.server.on('connection', this.onConnection);

            this.onError = async e => {
                this.server.close();
                // @ts-expect-error - type is missing
                const errorCode: string = e.code;
                const portOccupied = errorCode === 'EADDRINUSE' || errorCode === 'EACCES';

                if (this.ports.length) {
                    return this.stop().then(() => this.start());
                }

                if (portOccupied) {
                    const processInfo = await findProcessFromIncomingPort(port).catch(() => {});
                    const errorMessage = processInfo
                        ? `Port ${port} is occupied by process ${processInfo.name} (${processInfo.pid})`
                        : 'process info not found';
                    this.logger.error(errorMessage);

                    return resolve({
                        success: false,
                        error: 'port already in use',
                        message: errorMessage,
                    });
                }
                const errorMessage = `Start error code: ${errorCode}`;

                this.logger.error(errorMessage);

                return {
                    success: false,
                    error: 'other error',
                    message: `Start error code: ${errorCode}`,
                };
            };
            this.server.on('error', this.onError);

            this.server.listen(port, this.address, undefined, () => {
                this.logger.info('Server started, listening on port: ', port);
                const address = this.getServerAddress();
                if (address) {
                    this.emitter.emit('server/listening', address);
                }
                // even if server was instructed to start on a random port, take the real port and save it for future use (toggling server on and off)
                this.port = address.port;

                return resolve({ success: true, payload: address });
            });
        });
    }

    public stop() {
        // note that this method only stops listening but keeps existing connections open and thus port blocked
        this.emitter.removeAllListeners();
        if (this.onConnection) {
            this.server.off('connection', this.onConnection);
            this.onConnection = undefined;
        }
        if (this.onError) {
            this.server.off('error', this.onError);
            this.onError = undefined;
        }

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

    private registerRoute(pathname: string, method: Route['method'], handler: AnyRequestHandler[]) {
        const segments = this.splitSegments(pathname);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const baseSegments: string[] = segments[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const paramsSegments: string[] = segments[1];
        const basePathname = baseSegments.join('/');
        this.routes.push({
            method,
            pathname: `/${basePathname}`,
            params: paramsSegments,
            handler,
            isActive: true,
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

    public delete(pathname: string, handler: AnyRequestHandler[]) {
        this.registerRoute(pathname, 'DELETE', handler);
    }

    /**
     * Register common handlers that are run for all requests before route handlers
     */
    public use(handler: AnyRequestHandler[]) {
        this.routes.push({
            method: '*',
            pathname: '*',
            handler,
            params: [],
            isActive: true,
        });
    }

    public activateRoute(pathname: string) {
        const route = this.routes.find(r => r.pathname === pathname);
        if (route) {
            route.isActive = true;
        }
    }

    public deactivateRoute(pathname: string) {
        const route = this.routes.find(r => r.pathname === pathname);
        if (route) {
            route.isActive = false;
        }
    }

    private getSafeDecodedURI(param: string) {
        try {
            return decodeURIComponent(param);
        } catch (e) {
            this.logger.error(`Failed to decode param: ${e.message}`);
        }
    }

    /**
     * Find the best matching route using express.js-like matching logic.
     *
     * Rules:
     * 1. Route method must match (exact method or wildcard '*')
     * 2. Request path segments must equal base segments + parameter count
     * 3. Base segments must match exactly
     * 4. Remaining segments fill in the expected parameters
     * 5. Return the most specific match (most base segments)
     *
     * Examples:
     * - /enumerate matches POST /enumerate (1 base segment, 0 params)
     * - /enumerate does NOT match POST /enumerate/extra (1 base segment ≠ 2 request segments)
     * - /acquire/:path/:previous matches POST /acquire/1/2 (1 base + 2 params = 3 segments)
     * - / matches POST / (0 base segments, 0 params)
     * - / does NOT match POST /xyz (0 base segments ≠ 1 request segment)
     */
    private findBestMatchingRoute = (pathname: string, method = 'GET') => {
        // Split and filter to get only actual path segments (no empty strings from leading/trailing /)
        const requestSegments = pathname.split('/').filter(s => s);
        const routes = this.routes.filter(r => r.method === method || r.method === '*');

        let bestMatch: { route: Route; specificity: number } | undefined;

        for (const route of routes) {
            // Split and filter to get only actual route segments
            const routeSegments = route.pathname.split('/').filter(s => s);
            const expectedSegmentCount = routeSegments.length + route.params.length;

            // Request must have exactly the number of segments expected by this route
            if (requestSegments.length !== expectedSegmentCount) {
                continue;
            }

            // Verify that all base route segments match the request segments exactly
            let segmentsMatch = true;
            for (let i = 0; i < routeSegments.length; i++) {
                if (requestSegments[i] !== routeSegments[i]) {
                    segmentsMatch = false;
                    break;
                }
            }

            if (!segmentsMatch) {
                continue;
            }

            // This route matches! Calculate specificity as the number of base segments.
            // More specific routes (with more fixed segments vs parameters) should win.
            const specificity = routeSegments.length;

            if (!bestMatch || specificity > bestMatch.specificity) {
                bestMatch = { route, specificity };
            }
        }

        return bestMatch?.route;
    };
    /**
     * Entry point for handling requests
     */
    private onRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        // mostly ts stuff. request should always have url defined.
        if (!isRequest(request)) {
            this.logger.warn('Unexpected incoming message (no url)');
            this.emitter.emit('server/error', 'Unexpected incoming message');

            return;
        }

        request.on('aborted', () => {
            this.logger.info(`Request ${request.method} ${request.url} aborted`);
        });

        const { protocol, hostname, pathname, query } = parseRequestUrl(request.url);

        if (query) {
            for (const key in query) {
                if (Object.prototype.hasOwnProperty.call(query, key) && query[key] !== undefined) {
                    const allParamsOfSameKey = [query[key]].flat();
                    let isParamInvalid = false;

                    query[key] = allParamsOfSameKey.map(singleParam => {
                        const decoded = this.getSafeDecodedURI(singleParam);
                        const sanitized = sanitizeUrl(decoded);
                        // remove trailing slash from sanitized URL
                        if (sanitized.replace(/\/$/, '') !== decoded) isParamInvalid = true;

                        return sanitized;
                    });

                    if (isParamInvalid) {
                        response.statusCode = 403;

                        return response.end();
                    }
                }
            }
        }
        request.url = formatRequestUrl({ protocol, hostname, pathname, query });

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
            response.statusCode = 404;
            response.end();

            return;
        }

        if (!route.handler.length) {
            this.emitter.emit('server/error', `No handlers registered for route ${pathname}`);
            this.logger.warn(`No handlers registered for route ${pathname}`);
            response.statusCode = 500;
            response.end();

            return;
        }

        if (!route.isActive) {
            response.statusCode = 404;
            response.end();

            return;
        }

        const paramsSegments = pathname
            .replace(route.pathname, '')
            .split('/')
            .filter(segment => segment);

        let isSegmentInvalid = false;
        const requestWithParams = request as RequestWithParams;

        requestWithParams.params = route.params.reduce<Record<string, string>>(
            (acc, param, index) => {
                const paramsSegment = paramsSegments[index];
                if (!paramsSegment) return acc;
                const sanitized = sanitizeUrl(paramsSegment);
                if (sanitized !== paramsSegment) {
                    isSegmentInvalid = true;
                }

                acc[param.replace(':', '')] = sanitized;

                return acc;
            },
            {},
        );
        if (isSegmentInvalid) {
            response.statusCode = 403;

            return response.end();
        }

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

export const checkOrigin = ({
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
        try {
            const checkedHostname = `.${new URL(origin).hostname}`;
            isOriginAllowed = origins.some(o =>
                // match from the end to allow subdomains
                checkedHostname.endsWith('.' + o),
            );
        } catch (error) {
            // If parsing URL fails we don't want it to crash but silently logs error.
            logger.error(`Failed parsing URL: ${error}`);
        }
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
    let isRefererAllowed: boolean;
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
        } catch {
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

/**
 * Upper bound on a single request body we buffer in memory before rejecting with 413.
 *
 * Only the bridge `/call` and `/post` routes carry a large body — a hex-encoded device
 * message (`data`), i.e. ~2x the message byte size. The largest legitimate one is a
 * firmware-upload frame: on T1 the whole image (<= ~960 kB per `firmwareSizeMap`) is sent
 * in a single `FirmwareUpload` → ~1.9 MiB of hex. T2/T3 chunk the upload device-side via
 * `FirmwareRequest` (~128 kB per chunk), so no single message carries a whole image, and
 * everything else (signing, `/listen` descriptors, `/acquire` params, `/read`) is a few
 * kB. 8 MiB clears the real worst case (~1.9 MiB) with a wide margin. Without a cap a
 * caller streaming an unbounded chunked body would grow the buffer until `Buffer.concat`
 * OOMs and takes down the bridge process.
 */
export const MAX_BODY_SIZE = 8 * 1024 * 1024;

/**
 * Upper bound on the sum of all request bodies buffered concurrently across the whole
 * process. The per-request cap alone does not bound memory: N simultaneous in-flight
 * requests, each just under `MAX_BODY_SIZE`, could still buffer N × 8 MiB. This aggregate
 * budget caps total in-flight buffering regardless of connection count. It is generous
 * relative to real traffic (a single ~1.9 MiB firmware upload at a time) so it never
 * rejects legitimate requests, but it turns an unbounded fan-out into a hard ceiling.
 */
export const MAX_TOTAL_BODY_SIZE = 32 * 1024 * 1024;

/**
 * Live accounting for {@link MAX_TOTAL_BODY_SIZE}. Exported so tests can drive the
 * aggregate guard with a small limit and assert the budget is released on every code path.
 */
export const requestBodyBudget = {
    inFlightBytes: 0,
    maxTotalBytes: MAX_TOTAL_BODY_SIZE,
};

export class PayloadTooLargeError extends Error {
    constructor() {
        super('Payload too large');
        this.name = 'PayloadTooLargeError';
    }
}

/**
 * A body-parse rejection is either an over-cap body (respond 413) or a dead socket
 * (socket error / client abort — the connection is already gone, so nothing to respond
 * to). A synchronous throw from a *downstream* handler never reaches here: it is raised in
 * the `onFulfilled` branch of the parser's `.then(...)`, so it surfaces as an unhandled
 * rejection (handled process-wide) instead of being mis-reported as a body error.
 */
const handleBodyParseRejection = (error: unknown, response: Response) => {
    if (error instanceof PayloadTooLargeError && response.writable) {
        response.statusCode = 413;
        response.end(JSON.stringify({ error: 'Payload too large' }));
    }
};

export const parseBodyTextHelper = (request: Request, maxBytes: number = MAX_BODY_SIZE) =>
    new Promise<string>((resolve, reject) => {
        const hasData =
            (request.headers['content-length'] &&
                Number.parseInt(request.headers['content-length']) > 0) ||
            request.headers['transfer-encoding'] === 'chunked';

        if (!hasData) {
            return resolve('');
        }

        const tmp: Buffer[] = [];
        // bytes this request has added to the shared budget so far
        let charged = 0;
        let settled = false;

        // Settle exactly once and return this request's bytes to the shared budget. Every
        // termination path (end / cap / socket error / premature close) funnels through
        // here, so the aggregate budget can never leak and the buffered chunks are always
        // released for garbage collection.
        const settle = (finalize: () => void) => {
            if (settled) return;
            settled = true;
            requestBodyBudget.inFlightBytes -= charged;
            finalize();
            // Drop references to the buffered chunks now, so their memory is freed together
            // with the budget refund instead of lingering until `request` is garbage
            // collected. On the cap path this would otherwise keep ~maxBytes resident while
            // the stream drains; on the resolve path a long-poll (/listen) holds `request` —
            // and therefore this closure — open for a long time. `finalize` has already
            // produced the concatenated body above, so clearing `tmp` here is safe.
            tmp.length = 0;
        };

        request
            .on('data', (chunk: Buffer) => {
                if (settled) return;
                charged += chunk.length;
                requestBodyBudget.inFlightBytes += chunk.length;
                // per-request cap OR process-wide aggregate cap
                if (
                    charged > maxBytes ||
                    requestBodyBudget.inFlightBytes > requestBodyBudget.maxTotalBytes
                ) {
                    // stop buffering, drain-and-discard the rest of the stream, and bail
                    request.resume();
                    settle(() => reject(new PayloadTooLargeError()));

                    return;
                }
                tmp.push(chunk);
            })
            .on('end', () => settle(() => resolve(Buffer.concat(tmp).toString())))
            // A socket error must settle the promise; otherwise it hangs forever, pinning
            // the buffered chunks and this request's slice of the aggregate budget.
            .on('error', error => settle(() => reject(error)))
            // The socket can also go away without `end`/`error` (client abort). Settle so a
            // flood of aborted uploads cannot leak the buffer or the aggregate budget.
            .on('close', () =>
                settle(() => reject(new Error('Request stream closed before completion'))),
            );
    });

/**
 * Factory that creates a JSON body-parser middleware with a maximum body size limit.
 * Buffers at most `maxBytes`; responds 413 on an over-cap body and 400 on malformed JSON.
 * Shares the single capping implementation in {@link parseBodyTextHelper}.
 */
export const parseBodyJSONWithLimit =
    (maxBytes: number): RequestHandler<unknown, JSON> =>
    (request, response, next) => {
        parseBodyTextHelper(request, maxBytes).then(
            text => {
                let body: unknown;
                try {
                    body = text ? JSON.parse(text) : {};
                } catch (error) {
                    // malformed JSON is a client error and the socket is still open
                    if (response.writable) {
                        response.statusCode = 400;
                        response.end(
                            JSON.stringify({
                                error: `Invalid json body: ${error instanceof Error ? error.message : String(error)}`,
                            }),
                        );
                    }

                    return;
                }
                next(
                    Object.assign(request, { body }) as unknown as RequestWithParams<JSON>,
                    response,
                );
            },
            error => handleBodyParseRejection(error, response),
        );
    };

/**
 * set request.body as parsed JSON
 */
export const parseBodyJSON: RequestHandler<unknown, JSON> = parseBodyJSONWithLimit(MAX_BODY_SIZE);

/**
 * set request.body as string
 */
export const parseBodyText: RequestHandler<unknown, string> = (request, response, next) => {
    parseBodyTextHelper(request).then(
        body => next({ ...request, body }, response),
        error => handleBodyParseRejection(error, response),
    );
};
