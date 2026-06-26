import { ERRORS } from '@trezor/connect-common/src/constants';
import { corsValidator, parseManifest } from '@trezor/connect-common/src/data';
import {
    DEEPLINK_VERSION,
    DEFAULT_DOMAIN_MAJOR_VER,
} from '@trezor/connect-common/src/data/version';
import { type CallMethodPayload } from '@trezor/connect-common/src/events';
import { factoryPublic } from '@trezor/connect-common/src/factory';
import type { ConnectMobileSettings, Manifest } from '@trezor/connect-common/src/types';
import type { TrezorConnectCore } from '@trezor/connect-common/src/types/api';
import {
    type CancelParams,
    normalizeCancelParams,
} from '@trezor/connect-common/src/utils/cancelParams';
import { createDeferredManager, getWeakRandomUUID, removeTrailingSlashes } from '@trezor/utils';

type BuildUrlParams = {
    method: string;
    id: string;
    params: any;
    connectSrc: string | undefined;
    callbackUrl: string;
    manifest?: Manifest;
};

const buildUrl = ({ method, id, params, connectSrc, callbackUrl, manifest }: BuildUrlParams) => {
    const urlWithParams = new URL(callbackUrl);
    urlWithParams.searchParams.set('id', id);

    return (
        removeTrailingSlashes(connectSrc || DEFAULT_DOMAIN_MAJOR_VER) +
        `/deeplink/${DEEPLINK_VERSION}/` +
        `?method=${method}` +
        `&params=${encodeURIComponent(JSON.stringify(params))}` +
        `&callback=${encodeURIComponent(urlWithParams.toString())}` +
        (manifest?.appName ? `&appName=${encodeURIComponent(manifest.appName)}` : '') +
        (manifest?.appIcon ? `&appIcon=${encodeURIComponent(manifest.appIcon)}` : '')
    );
};

export class TrezorConnectDeeplink implements TrezorConnectCore<ConnectMobileSettings> {
    // Prefer crypto.randomUUID, but fall back to a weak id where `crypto` is absent: connect-mobile
    // is a published deeplink transport for third-party React Native apps that may lack a `crypto`
    // polyfill. These ids are only request/response correlation keys, so the weak fallback is fine.
    private messages = createDeferredManager({
        generateId: () =>
            typeof globalThis.crypto?.randomUUID === 'function'
                ? globalThis.crypto.randomUUID()
                : getWeakRandomUUID(),
    });

    private manifest?: Manifest;

    private openDeeplink: (method: string, id: string, params: any) => void = () => {
        throw ERRORS.TypedError('Init_NotInitialized');
    };

    public init({
        manifest,
        connectSrc,
        deeplinkOpen,
        deeplinkCallbackUrl,
    }: ConnectMobileSettings) {
        this.manifest = parseManifest(manifest);

        if (!this.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        if (!deeplinkOpen) {
            throw new Error('TrezorConnect native requires "deeplinkOpen" setting.');
        }
        if (!deeplinkCallbackUrl) {
            throw new Error('TrezorConnect native requires "deeplinkCallbackUrl" setting.');
        }
        try {
            new URL(deeplinkCallbackUrl);
        } catch {
            throw new Error('Provided "deeplinkCallbackUrl" is not valid.');
        }

        const validConnectSrc =
            connectSrc === 'trezorsuite://connect' ? connectSrc : corsValidator(connectSrc);

        this.openDeeplink = (method, id, params) => {
            const url = buildUrl({
                method,
                id,
                params,
                connectSrc: validConnectSrc,
                callbackUrl: deeplinkCallbackUrl,
                manifest: this.manifest,
            });
            deeplinkOpen(url);
        };

        return Promise.resolve();
    }

    public call(params: CallMethodPayload) {
        const { promise, promiseId } = this.messages.create();
        const { method, ...restParams } = params;

        this.openDeeplink(method, promiseId, restParams);

        return promise;
    }

    public cancel(params?: CancelParams) {
        const { reason } = normalizeCancelParams(params);
        this.resolveMessagePromises({ success: false, error: reason });
    }

    public dispose() {
        this.manifest = undefined;
        this.openDeeplink = () => {
            throw ERRORS.TypedError('Init_NotInitialized');
        };

        return Promise.resolve(undefined);
    }

    public handleDeeplink(url: string): void {
        let id;
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
            id = parsedUrl.searchParams.get('id');
            if (!id) throw new Error('Missing `id` parameter.');
        } catch (error) {
            this.resolveMessagePromises({ success: false, error });

            return;
        }

        const responseParam = parsedUrl.searchParams.get('response');
        if (!responseParam) {
            this.messages.resolve(id, {
                id,
                success: false,
                error: 'The provided url is missing `response` parameter.',
            });

            return;
        }

        let parsedParams;
        try {
            parsedParams = JSON.parse(responseParam);
        } catch {
            /* empty */
        }

        if (!parsedParams) {
            this.messages.resolve(id, {
                id,
                success: false,
                error: 'Error parsing deeplink params.',
            });
        }

        const { success, payload } = parsedParams;
        this.messages.resolve(id, { id, payload, success });
    }

    private resolveMessagePromises(payload: Record<string, any>) {
        this.messages.resolveAll(id => ({ id, payload }));
    }
}

const TrezorConnect = factoryPublic(new TrezorConnectDeeplink());

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
