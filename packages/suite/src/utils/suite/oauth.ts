import { getPrefixedURL } from '@suite-utils/router';
import { METADATA } from '@suite-actions/constants';
import { Deferred, createDeferred } from '@suite-utils/deferred';
import { urlHashParams } from '@suite-utils/metadata';

/**
 * For desktop, always use oauth_receiver.html from trezor.io
 * For web, use oauth_receiver.html hosted on the same origin (localhost/sldev/trezor.io)
 */
export const getOauthReceiverUrl = () => {
    if (!window.desktop_api) {
        const { origin } = window.location;
        // For the purpose of e2e tests change the redirect url to develop branch on sldev.cz
        if (origin.indexOf('sldev.cz') >= 0) {
            return 'https://suite.corp.sldev.cz/suite-web/develop/wallet/static/oauth/oauth_receiver.html';
        }
        return `${origin}${getPrefixedURL('/static/oauth/oauth_receiver.html')}`;
    }
    // TEMP: for desktop. but this solution is temporary, local http server will be used later to accept callback
    return 'https://wallet.trezor.io/oauth_receiver.html';
};

export const getMetadataOauthToken = (url: string) => {
    const originalParams = urlHashParams(url);

    const dfd: Deferred<string> = createDeferred();

    const props = METADATA.AUTH_WINDOW_PROPS;

    const onMessage = (e: MessageEvent) => {
        // filter non oauth messages
        if (
            !['wallet.trezor.io', 'beta-wallet.trezor.io', window.location.origin].includes(
                e.origin,
            )
        ) {
            return;
        }

        if (typeof e.data !== 'string') return;

        const params = urlHashParams(e.data);

        if (params.state !== originalParams.state) {
            return;
        }

        const token = params.access_token;

        if (token) {
            dfd.resolve(token);
        } else {
            dfd.reject(new Error('Cancelled'));
        }
    };

    if (window.desktop_api) {
        const onIpcMessage = (_sender: any, message: any) => {
            onMessage({ ...message, origin: 'wallet.trezor.io' });
            window.desktop_api.off('oauth', onIpcMessage);
        };
        window.desktop_api.on('oauth', onIpcMessage);
    } else {
        window.addEventListener('message', onMessage);
    }

    window.open(url, METADATA.AUTH_WINDOW_TITLE, props);

    return dfd.promise;
};
