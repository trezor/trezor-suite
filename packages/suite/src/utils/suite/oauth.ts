import { desktopApi } from '@trezor/suite-desktop-api';
import { getPrefixedURL } from 'src/utils/suite/router';
import { METADATA_PROVIDER } from 'src/actions/suite/constants';
import { Deferred, createDeferred } from '@trezor/utils';
import { urlHashParams, urlSearchParams } from 'src/utils/suite/metadata';

/**
 * For web, use oauth_receiver.html hosted on the same origin (localhost/sldev/trezor.io)
 */
export const getOauthReceiverUrl = () => {
    if (!desktopApi.available) {
        return `${window.location.origin}${getPrefixedURL('/static/oauth/oauth_receiver.html')}`;
    }

    return desktopApi.getHttpReceiverAddress('/oauth');
};

type Credentials =
    | { access_token?: undefined; code: string }
    | { access_token: string; code?: undefined };

type Message = { [key: string]: string };

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
    uri: string,
    name: string,
    options: string,
    closeCallback: () => void,
) => {
    const win = window.open(uri, name, options);
    clearInterval(interval);
    interval = window.setInterval(() => {
        // todo: for some reason, when used in electron, win has closed=true right from the start and thus closeCallback
        // is invoked immediately. temporary workaround is not to use openWindowOnAnotherDomain in electron
        if (!win || win.closed) {
            window.clearInterval(interval);
            closeCallback();
        }
    }, 1000);

    return win;
};

const handleResponse = (
    message: Message,
    originalParams: { [key: string]: string },
    onSuccess: (result: Credentials) => void,
    onError: (error: any) => void,
) => {
    if (!message.search && !message.hash) return;
    let parsedMessage;

    if (message.search) {
        parsedMessage = urlSearchParams(message.search);
    } else if (message.hash) {
        parsedMessage = urlHashParams(message.hash);
    }

    if (!parsedMessage) return;

    const { code, access_token, state, error_description, error } = parsedMessage;

    if (error === 'access_denied') {
        // user clicks cancel in popup interface. This is the same as if user closed the window,
        onError(new Error('window closed'));
    } else if (error) {
        // otherwise just show error. This should not happen often, most of the errors can be caused by improper
        // implementation only. Possibly "temporarily_unavailable" or "server_error" may appear
        // see possible errors in oauth protocol described here https://tools.ietf.org/html/rfc6749#section-4.1.2.1
        onError(new Error(`${error}: ${error_description.replace(/\+/g, ' ')}`));
    } else if (originalParams.state && state !== originalParams.state) {
        onError(new Error('state does not match'));
    } else if (code || access_token) {
        onSuccess({ code, access_token } as unknown as Credentials);
    } else {
        onError(new Error('Unexpected response form data provider'));
    }
};

// keep handler function instance in top level scope
let desktopHandlerInstance: (message: Message) => void;
let webHandlerInstance: (e: MessageEvent<Message>) => void;

const getDesktopHandlerInstance = (
    dfd: Deferred<Credentials>,
    originalParams: { [key: string]: string },
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
    dfd: Deferred<Credentials>,
    originalParams: { [key: string]: string },
) => {
    if (webHandlerInstance) {
        window.removeEventListener('message', webHandlerInstance);
    }
    webHandlerInstance = (e: MessageEvent<Message>) => {
        if (window.location.origin !== e.origin) return;
        if (!e.data.search && !e.data.hash) return;
        if (e.data.key !== 'trezor-oauth') return;

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
export const extractCredentialsFromAuthorizationFlow = (url: string) => {
    const originalParams = urlHashParams(url);
    const dfd = createDeferred<Credentials>();

    if (desktopApi.available) {
        // to make sure that there is always only one listener registered remove all listeners before creating a new one
        desktopApi.removeAllListeners('oauth/response');
        // this listener may never be called in some cases
        desktopApi.once('oauth/response', getDesktopHandlerInstance(dfd, originalParams));
        window.open(url, METADATA_PROVIDER.AUTH_WINDOW_TITLE, METADATA_PROVIDER.AUTH_WINDOW_PROPS);
    } else {
        window.addEventListener('message', getWebHandlerInstance(dfd, originalParams));
        openWindowOnAnotherDomain(
            url,
            METADATA_PROVIDER.AUTH_WINDOW_TITLE,
            METADATA_PROVIDER.AUTH_WINDOW_PROPS,
            () => {
                // note that this rejection happens even on successful authorization.
                // 'window closed' error message may be used to differentiate between errors
                setTimeout(() => {
                    window.removeEventListener(
                        'message',
                        getWebHandlerInstance(dfd, originalParams),
                    );
                    dfd.reject(new Error('window closed'));
                }, 5000);
            },
        );
    }

    return dfd.promise;
};
