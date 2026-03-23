import z, { ZodError } from 'zod';

import { desktopApi } from '@trezor/suite-desktop-api';
import { type Deferred, createDeferred } from '@trezor/utils';

import * as METADATA_PROVIDER from './metadataProviderConstants';

// Copy-pasted from packages/suite/src/utils/suite/router.ts to break dependency
//
// Prefix a url with ASSET_PREFIX (eg. name of the branch in CI)
// Useful with next.js Router.push() that accepts `as` prop as second arg
export const getPrefixedURL = (pathname: string) => {
    // do not use object destructuring https://github.com/webpack/webpack/issues/5392
    const prefix = process.env.ASSET_PREFIX;

    return prefix && !pathname.startsWith(prefix) ? `${prefix}${pathname}` : pathname;
};

/**
 * For web, use oauth_receiver.html hosted on the same origin (localhost/sldev/trezor.io)
 */
export const getOauthReceiverUrl = () => {
    if (!desktopApi.available) {
        return new URL(
            getPrefixedURL('/static/oauth/oauth_receiver.html'),
            window.location.origin,
        ).toString();
    }

    return desktopApi.getHttpReceiverAddress('/oauth');
};

let interval: number;

/**
 * Use this function to workaround impossibility to detect beforeunload event
 * for windows loaded on another domains
 * @param uri
 * @param name
 * @param options
 * @param closeCallback
 */
const openWindowOnAnotherDomain = (
    url: URL,
    name: string,
    options: string,
    closeCallback: () => void,
) => {
    const win = window.open(url, name, options);
    clearInterval(interval);
    interval = window.setInterval(() => {
        // todo: for some reason, when used in electron, win has closed=true right from the start and thus closeCallback
        // is invoked immediately. temporary workaround is not to use openWindowOnAnotherDomain in electron
        if (!win) {
            window.clearInterval(interval);
            closeCallback();
        }
    }, 1000);

    return win;
};

const oauthResponseMessage = z
    .object({
        key: z.literal('trezor-oauth'),
        search: z.string().startsWith('?'),
    })
    .or(
        z.object({
            key: z.literal('trezor-oauth'),
            hash: z.string().startsWith('#'),
        }),
    );

export type OAuthResponseMessage = z.infer<typeof oauthResponseMessage>;

const oauthResult = oauthResponseMessage.transform(value => {
    const searchOrHash = 'search' in value ? value.search : value.hash;

    return Object.fromEntries(new URLSearchParams(searchOrHash.slice(1)).entries());
});

const oauthResultParams = z.object({
    access_token: z.string().optional(),
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
});

type OAuthResultParams = z.infer<typeof oauthResultParams>;
type OAuthCredentials = Pick<OAuthResultParams, 'code' | 'access_token'>;

const oauthOriginalParams = z.object({
    state: z.string().nonempty(),
});

function handleResponseError(error?: string, errorDescription?: string) {
    if (!error) {
        return;
    }

    switch (error) {
        case 'access_denied':
            // user clicks cancel in popup interface. This is the same as if user closed the window,
            return new Error('Window closed');
        default:
            // otherwise just show error. This should not happen often, most of the errors can be caused by improper
            // implementation only. Possibly "temporarily_unavailable" or "server_error" may appear
            // see possible errors in oauth protocol described here https://tools.ietf.org/html/rfc6749#section-4.1.2.1
            return new Error(`${error}: ${errorDescription?.replace(/\+/g, ' ')}`);
    }
}

const handleResponse = (
    response: OAuthResponseMessage,
    originalParams: URLSearchParams,
    onSuccess: (result: OAuthCredentials) => void,
    onError: (error: Error) => void,
) => {
    try {
        const resultParams = oauthResult.parse(response);
        const parsedResultParams = oauthResultParams.parse(resultParams);
        const parsedOriginalParams = oauthOriginalParams.parse({
            state: originalParams.get('state'),
        });

        const { code, access_token, state, error_description, error } = parsedResultParams;

        if (state !== parsedOriginalParams.state) {
            return onError(new Error('Invalid response from data provider'));
        }

        handleResponseError(error, error_description);

        onSuccess({ code, access_token });
    } catch (error) {
        if (error instanceof ZodError) {
            console.error(error);

            return onError(new Error('Invalid response from data provider'));
        }

        onError(
            error instanceof Error ? error : new Error('Unexpected response form data provider'),
        );
    }
};

// keep handler function instance in top level scope
let desktopHandlerInstance: (message: OAuthResponseMessage) => void;
let webHandlerInstance: (e: MessageEvent<OAuthResponseMessage>) => void;

const getDesktopHandlerInstance = (
    dfd: Deferred<OAuthCredentials>,
    originalParams: URLSearchParams,
) => {
    desktopHandlerInstance = message => {
        handleResponse(
            message,
            originalParams,
            credentials => {
                desktopApi.removeAllListeners('oauth/response');
                dfd.resolve(credentials);
            },
            error => {
                desktopApi.removeAllListeners('oauth/response');
                dfd.reject(error);
            },
        );
    };

    return desktopHandlerInstance;
};

const getWebHandlerInstance = (
    dfd: Deferred<OAuthCredentials>,
    originalParams: URLSearchParams,
) => {
    if (webHandlerInstance) {
        window.removeEventListener('message', webHandlerInstance);
    }
    webHandlerInstance = (e: MessageEvent<OAuthResponseMessage>) => {
        if (window.location.origin !== e.origin) return;
        if (!oauthResult.safeParse(e.data).success) return;

        handleResponse(
            e.data,
            originalParams,
            credentials => {
                dfd.resolve(credentials);
            },
            error => {
                dfd.reject(error);
            },
        );
    };

    return webHandlerInstance;
};

/**
 * Handle extraction of authorization code from Oauth2 protocol
 */
export const extractCredentialsFromAuthorizationFlow = (url: URL) => {
    const dfd = createDeferred<OAuthCredentials>();

    if (desktopApi.available) {
        // to make sure that there is always only one listener registered remove all listeners before creating a new one
        desktopApi.removeAllListeners('oauth/response');
        // this listener may never be called in some cases
        desktopApi.once('oauth/response', getDesktopHandlerInstance(dfd, url.searchParams));
        window.open(url, METADATA_PROVIDER.AUTH_WINDOW_TITLE, METADATA_PROVIDER.AUTH_WINDOW_PROPS);
    } else {
        const messageHandler = getWebHandlerInstance(dfd, url.searchParams);

        window.addEventListener('message', messageHandler);
        openWindowOnAnotherDomain(
            url,
            METADATA_PROVIDER.AUTH_WINDOW_TITLE,
            METADATA_PROVIDER.AUTH_WINDOW_PROPS,
            () => {
                // note that this rejection happens even on successful authorization.
                // 'window closed' error message may be used to differentiate between errors
                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    dfd.reject(new Error('window closed'));
                }, 5000);
            },
        );
    }

    return dfd.promise;
};
