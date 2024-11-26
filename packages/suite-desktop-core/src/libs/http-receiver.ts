import * as url from 'url';

import { xssFilters } from '@trezor/utils';
import { HttpServer, allowReferers } from '@trezor/node-utils';
import { trezorLogo } from '@suite-common/suite-constants';

import { convertILoggerToLog } from '../utils/IloggerToLog';

type TemplateOptions = {
    title?: string;
    script?: string;
};
/**
 * Events that may be emitted or listened to by HttpReceiver
 */
interface Events {
    'oauth/response': (response: { [key: string]: string }) => void;
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

export const createHttpReceiver = () => {
    const httpReceiver = new HttpServer<Events>({
        logger: convertILoggerToLog(global.logger, { serviceName: 'http-receiver' }),
        port: 21335,
    });

    httpReceiver.use([
        (request, response, next) => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            next(request, response);
        },
    ]);

    httpReceiver.get('/oauth', [
        allowReferers(['', '127.0.0.1', 'www.dropbox.com']), // No referer is sent by Google, Dropbox sends referer when using Safari
        (request, response) => {
            const { search } = url.parse(request.url, true);
            if (search) {
                // send data back to main window
                httpReceiver.emit('oauth/response', { search });
            }

            // replace # with ? so that query parameters can be read by renderer
            const script = `
                <script>
                    if (window.location.href.includes('#')) {
                        fetch(window.location.href.replace('#', '?'))
                    }
                </script>
            `;
            const template = applyTemplate(undefined, { script });
            response.end(template);
        },
    ]);

    httpReceiver.get('/buy-redirect', [
        allowReferers(['', 'localhost:3000', '*.invity.io', 'invity.io']),
        (request, response) => {
            const { query } = url.parse(request.url, true);
            if (query && query.p) {
                httpReceiver.emit('buy/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);

    httpReceiver.get('/buy-post', [
        allowReferers(['']), // No referer
        (request, response) => {
            try {
                const { searchParams } = new URL(request.url, 'http://127.0.0.1:21335'); // hostname is not important here, just to be able to validate relative URL
                const action = new URL(searchParams.get('a') || '').href; // action has to be a valid URL, otherwise throw an error
                const content = `
            Forwarding to ${xssFilters.inHTML(action)}...
            <form id="buy-form" method="POST" action="${xssFilters.inDoubleQuotes(action)}">
            ${Array.from(searchParams)
                .filter(([key]) => key !== 'a')
                .map(
                    ([key, value]) =>
                        `<input type="hidden" name="${key}" value="${xssFilters.inDoubleQuotes(
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
                throw new Error(`Could not handle buy post request: ${error}`);
            }
        },
    ]);

    httpReceiver.get('/sell-redirect', [
        allowReferers(['']), // No referer
        (request, response) => {
            const { query } = url.parse(request.url, true);
            if (query && query.p) {
                httpReceiver.emit('sell/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);

    httpReceiver.get('/exchange-redirect', [
        allowReferers(['']), // No referer
        (request, response) => {
            const { query } = url.parse(request.url, true);
            if (query && query.p) {
                httpReceiver.emit('exchange/redirect', query.p.toString());
            }

            const template = applyTemplate();
            response.end(template);
        },
    ]);

    return httpReceiver;
};
