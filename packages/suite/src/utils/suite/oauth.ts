/* eslint-disable camelcase */

import { getPrefixedURL } from '@suite-utils/router';
import { METADATA } from '@suite-actions/constants';
import { Deferred, createDeferred } from '@suite-utils/deferred';
import { urlHashParams, urlSearchParams } from '@suite-utils/metadata';

/**
 * For web, use oauth_receiver.html hosted on the same origin (localhost/sldev/trezor.io)
 */
export const getOauthReceiverUrl = () => {
    if (!window.desktopApi) {
        return `${window.location.origin}${getPrefixedURL('/static/oauth/oauth_receiver.html')}`;
    }
    return window.desktopApi!.getHttpReceiverAddress('/oauth');
};

type Credentials =
    | { access_token?: undefined; code: string }
    | { access_token: string; code?: undefined };

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
        if (win == null || win.closed) {
            window.clearInterval(interval);
            closeCallback();
        }
    }, 1000);
    return win;
};

/**
 * Handle extraction of authorization code from Oauth2 protocol
 */
export const extractCredentialsFromAuthorizationFlow = (url: string) => {
    const originalParams = urlHashParams(url);

    const dfd: Deferred<Credentials> = createDeferred();

    const onMessageWeb = (e: MessageEvent) => {
        // oauth message is post-messaged from oauth_receiver.html that is hosted on the same origin
        if (window.location.origin !== e.origin) {
            return;
        }

        if (!e.data.search && !e.data.hash) return;

        let message;

        if (e.data.search) {
            message = urlSearchParams(e.data.search);
        } else if (e.data.hash) {
            message = urlHashParams(e.data.hash);
        }
        if (!message) return;

        const { code, access_token, state } = message;

        if (originalParams.state && state !== originalParams.state) {
            dfd.reject(new Error('state does not match'));
        }

        if (code || access_token) {
            dfd.resolve(({ code, access_token } as unknown) as Credentials);
        } else {
            dfd.reject(new Error('Cancelled'));
        }
        window.removeEventListener('message', onMessageWeb);
    };

    const { desktopApi } = window;
    if (desktopApi) {
        const onMessageDesktop = (code: string) => {
            if (code) {
                dfd.resolve({ code });
            } else {
                dfd.reject(new Error('Cancelled'));
            }
        };
        desktopApi.once('oauth/code', onMessageDesktop);
    } else {
        window.addEventListener('message', onMessageWeb);
    }

    openWindowOnAnotherDomain(url, METADATA.AUTH_WINDOW_TITLE, METADATA.AUTH_WINDOW_PROPS, () => {
        window.removeEventListener('message', onMessageWeb);
        setTimeout(() => {
            dfd.reject(new Error('window closed'));
        }, 5000);
    });

    return dfd.promise;
};
