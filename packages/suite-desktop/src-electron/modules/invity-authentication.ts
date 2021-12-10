// TODO: description
import { session } from 'electron';
import invityAPI from '@suite-services/invityAPI';

// TODO: inject httpServerUrl?
const httpServerUrl = 'http://localhost:21335';

// TODO: extract to some more general place?
const parseCookie = (cookie: string) =>
    Object.fromEntries(
        cookie.split('; ').map(cookie => {
            const [key, ...value] = cookie.split('=');
            return [key, value.join('=')];
        }),
    );

const init = ({ interceptor }: Dependencies) => {
    const { logger } = global;

    const invityAuthenticationServerUrls = invityAPI.getAllDesktopAuthenticationServerUrls();
    const invityApiServerUrls = invityAPI.getAllApiServerUrls();

    interceptor.onBeforeSendHeadersAsync(async ({ requestHeaders, url }) => {
        if (
            [...invityAuthenticationServerUrls, ...invityApiServerUrls, httpServerUrl].some(
                allowedUrl => url.startsWith(allowedUrl),
            )
        ) {
            logger.debug('invity-authentication', 'Setting origin to current HTTP request.');
            requestHeaders.Origin = httpServerUrl;

            logger.debug('invity-authentication', 'Getting cookie.');
            const cookies = await session.defaultSession.cookies.get({});
            const cookieValue = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

            if (cookieValue) {
                logger.debug('invity-authentication', 'Setting cookie to current HTTP request.');
                requestHeaders.Cookie = cookieValue;
            }
        }
        return {
            cancel: false,
            requestHeaders,
        };
    });

    const setCookie = async (setCookieHeader: string[], startsWithName: string) => {
        const cookie = setCookieHeader.find(cookie => cookie.startsWith(startsWithName));
        if (cookie) {
            const parsedCookie = parseCookie(cookie);

            if (parsedCookie && parsedCookie['Max-Age']) {
                const parsedCookieValue = Object.entries(parsedCookie).find(entry =>
                    entry?.[0]?.startsWith(startsWithName),
                );
                if (parsedCookieValue) {
                    logger.debug('invity-authentication', `Setting cookie: ${startsWithName}`);
                    await session.defaultSession.cookies.set({
                        url: httpServerUrl,
                        name: parsedCookieValue[0],
                        domain: 'localhost',
                        value: parsedCookieValue[1],
                        expirationDate: Date.now() / 1000 + Number(parsedCookie['Max-Age']),
                        httpOnly: true,
                        path: '/',
                        sameSite: 'lax',
                        secure: true,
                    });
                }
            }
        } else {
            logger.debug(
                'invity-authentication',
                `Cookie starting with '${startsWithName}' was not found.`,
            );
        }
    };

    interceptor.onHeadersReceivedAsync(async ({ responseHeaders, url }) => {
        if (
            [...invityAuthenticationServerUrls, httpServerUrl].some(allowedUrl =>
                url.startsWith(allowedUrl),
            )
        ) {
            if (responseHeaders) {
                const setCookieHeader = responseHeaders['Set-Cookie'];
                if (setCookieHeader) {
                    await setCookie(setCookieHeader, 'csrf_token');
                    await setCookie(setCookieHeader, 'ory_kratos_session');
                }
                return {
                    cancel: false,
                    responseHeaders,
                };
            }
        }
    });
};

export default init;
