import { trezorLogo } from '@suite-common/suite-constants';
import { HttpServer, allowReferers, parseRequestUrl } from '@trezor/node-utils';
import { type RendererChannels } from '@trezor/suite-desktop-api';
import { xssFilters } from '@trezor/utils';

import { convertILoggerToLog } from '../utils/IloggerToLog';

type TemplateOptions = {
    title?: string;
    script?: string;
};

/**
 * Lightweight runtime status of the built-in HTTP server, rendered on `/status`.
 */
export type HttpReceiverStatus = {
    /** Application version, e.g. `25.6.1`. */
    appVersion?: string;
    /** Whether the connect-popup WebSocket transport (`/connect-ws`) is enabled. */
    connectPopupWsEnabled: boolean;
};
/**
 * Events that may be emitted or listened to by HttpReceiver
 */
interface Events {
    'oauth/response': (response: RendererChannels['oauth/response']) => void;
    'oauth/error': (message: string) => void;
    'buy/redirect': (url: string) => void;
    'sell/redirect': (url: string) => void;
    'exchange/redirect': (url: string) => void;
}

const applyTemplate = (content = 'You may now close this window.', options?: TemplateOptions) => {
    const template = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${options?.title ?? 'Trezor Suite'}</title>
                ${options?.script || ''}
                <style>
                    body, html {
                      width: 100%;
                      height: 100%;
                      margin: 0;
                      padding: 0;
                      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: center;
                    }
                    a {
                        text-decoration: none;
                        cursor: pointer;
                        color: #171717;
                        font-weight: 500;
                        display: inline-flex;
                        align-items: center;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <img style="margin-bottom:40px" alt="trezor logo" src="data:image/png;base64, ${trezorLogo}" />
                ${content}
                <a style="margin-top:40px" href="trezorsuite://">Go back to Trezor Suite</a>
            </body>
        </html>
    `;

    return template;
};

/**
 * Standalone, dependency-free status page. Intentionally minimal: no logo, no
 * scripts, no external assets – just plain HTML/CSS describing the server state.
 */
const renderStatusPage = (status?: HttpReceiverStatus) => {
    const wsEnabled = status?.connectPopupWsEnabled ?? false;
    const version = status?.appVersion;

    const row = (label: string, on: boolean) => `
        <div class="row">
            <span class="label">${label}</span>
            <span class="value ${on ? 'on' : 'off'}">${on ? 'Enabled' : 'Disabled'}</span>
        </div>
    `;

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Trezor Suite – Status</title>
        <style>
            body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                color: #171717;
                background: #f7f7f7;
            }
            main {
                width: 320px;
                padding: 24px;
                background: #fff;
                border: 1px solid #ebebeb;
                border-radius: 12px;
            }
            h1 {
                margin: 0 0 4px;
                font-size: 16px;
                font-weight: 600;
            }
            p {
                margin: 0 0 20px;
                font-size: 13px;
                color: #757575;
            }
            .row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 0;
                border-top: 1px solid #ebebeb;
                font-size: 14px;
            }
            .value {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            .value::before {
                content: "";
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
            }
            .value.on {
                color: #21963b;
            }
            .value.off {
                color: #b0b0b0;
            }
        </style>
    </head>
    <body>
        <main>
            <h1>Trezor Suite</h1>
            <p>Local HTTP server is running${version ? ` · v${xssFilters.inHTML(version)}` : ''}.</p>
            ${row('Connect popup WebSocket', wsEnabled)}
        </main>
    </body>
</html>`;
};

/**
 * Ports the built-in HTTP server tries, in order. A fallback range is used
 * because the well-known default (21335) is occasionally already taken — most
 * often by a stale or second Suite instance — which would otherwise disable
 * OAuth labeling (Dropbox/Google) and the Invity redirects for that session.
 */
const HTTP_RECEIVER_PORTS = [21335, 21336, 21337, 21338, 21339];

export const createHttpReceiver = (options?: {
    port?: number;
    /** Provides the current status rendered on the `/status` page. */
    getStatus?: () => HttpReceiverStatus;
}) => {
    // Note that if we override the `address` to something else than 127.0.0.1 or localhost, it might break google oauth
    const httpReceiver = new HttpServer<Events>({
        logger: convertILoggerToLog(global.logger, { serviceName: 'http-receiver' }),
        // Honor an explicitly requested port (`0` in unit tests binds a random free
        // port); otherwise fall back across a small range so a single occupied port
        // — typically a stale/second Suite instance holding 21335 — doesn't leave the
        // OAuth (Dropbox/Google) and Invity redirect endpoints unreachable.
        ...(options?.port !== undefined ? { port: options.port } : { ports: HTTP_RECEIVER_PORTS }),
    });

    httpReceiver.use([
        (request, response, next) => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            next(request, response);
        },
    ]);

    // Lightweight status page. Unlike the other routes it stays active so it can
    // always be reached to inspect the server while it is running. The server is
    // bound to 127.0.0.1 and sets no CORS headers, so a cross-origin page can't
    // read this (trivial) response anyway.
    httpReceiver.get('/status', [
        (_request, response) => {
            response.end(renderStatusPage(options?.getStatus?.()));
        },
    ]);

    httpReceiver.get('/oauth', [
        allowReferers(['', '127.0.0.1', 'www.dropbox.com']), // No referer is sent by Google, Dropbox sends referer when using Safari
        (request, response) => {
            const { search, hash } = parseRequestUrl(request.url);

            // send data back to main window
            httpReceiver.emit('oauth/response', {
                key: 'trezor-oauth',
                hash: hash!,
                search: search!,
            });

            response.end(applyTemplate());
        },
    ]);
    httpReceiver.deactivateRoute('/oauth');

    httpReceiver.get('/buy-redirect', [
        allowReferers(['', 'localhost:3000', '*.invity.io', 'invity.io']),
        (request, response) => {
            const { query } = parseRequestUrl(request.url);
            if (query?.p) {
                httpReceiver.emit('buy/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);
    httpReceiver.deactivateRoute('/buy-redirect');

    httpReceiver.get('/buy-post', [
        allowReferers(['']), // No referer
        (request, response) => {
            try {
                const { searchParams } = new URL(request.url, 'http://127.0.0.1:21335'); // hostname is not important here, just to be able to validate relative URL
                const { href: action, protocol } = new URL(searchParams.get('a') || ''); // action has to be a valid URL, otherwise throw an error

                if (protocol !== 'https:' && protocol !== 'http:') {
                    return response.end('invalid request');
                }

                const content = `
            Forwarding to ${xssFilters.inHTML(action)}...
            <form id="buy-form" method="POST" action="${xssFilters.inDoubleQuotes(action)}">
            ${Array.from(searchParams)
                .filter(([key]) => key !== 'a')
                .map(
                    ([key, value]) =>
                        `<input type="hidden" name="${xssFilters.inDoubleQuotes(key)}" value="${xssFilters.inDoubleQuotes(
                            value,
                        )}">`,
                )
                .join('')}
            </form>
            <script type="text/javascript">document.getElementById("buy-form").submit();</script>
        `;

                const template = applyTemplate(content);
                response.end(template);
            } catch (error) {
                const template = applyTemplate('Error');
                response.end(template);
                throw new Error(`Could not handle buy post request at ${request.url} : ${error}`, {
                    cause: error,
                });
            }
        },
    ]);
    httpReceiver.deactivateRoute('/buy-post');

    httpReceiver.get('/sell-redirect', [
        allowReferers(['']), // No referer
        (request, response) => {
            const { query } = parseRequestUrl(request.url);
            if (query?.p) {
                httpReceiver.emit('sell/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);
    httpReceiver.deactivateRoute('/sell-redirect');

    httpReceiver.get('/exchange-redirect', [
        allowReferers(['']), // No referer
        (request, response) => {
            const { query } = parseRequestUrl(request.url);
            if (query?.p) {
                httpReceiver.emit('exchange/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);
    httpReceiver.deactivateRoute('/exchange-redirect');

    return httpReceiver;
};
