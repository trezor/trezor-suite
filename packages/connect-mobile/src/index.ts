import EventEmitter from 'events';

import * as ERRORS from '@trezor/connect/src/constants/errors';
import { corsValidator, parseManifest } from '@trezor/connect/src/data/connectSettings';
import { DEEPLINK_VERSION, DEFAULT_DOMAIN_MAJOR_VER } from '@trezor/connect/src/data/version';
import type { CallMethodPayload } from '@trezor/connect/src/events/call';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { ConnectSettingsMobile, Manifest } from '@trezor/connect/src/types';
import { Deferred, createDeferred, removeTrailingSlashes } from '@trezor/utils';

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
    const callback = urlWithParams.toString();

    return (
        removeTrailingSlashes(connectSrc || DEFAULT_DOMAIN_MAJOR_VER) +
        `/deeplink/${DEEPLINK_VERSION}/` +
        `?method=${method}` +
        `&params=${encodeURIComponent(JSON.stringify(params))}` +
        `&callback=${encodeURIComponent(callback)}` +
        (manifest?.appName ? `&appName=${encodeURIComponent(manifest.appName)}` : '') +
        (manifest?.appIcon ? `&appIcon=${encodeURIComponent(manifest.appIcon)}` : '')
    );
};

export class TrezorConnectDeeplink implements ConnectFactoryDependencies<ConnectSettingsMobile> {
    public eventEmitter = new EventEmitter();
    private messagePromises: Record<number, Deferred<any>> = {};
    private messageID = 0;

    private _manifest: Manifest | undefined;

    public constructor() {
        this.openDeeplink = () => {
            throw ERRORS.TypedError('Init_NotInitialized');
        };
    }

    public manifest(manifest: Manifest) {
        this._manifest = parseManifest(manifest);
    }

    public setTransports() {
        // TODO: implement
        throw new Error('Unsupported right now');
    }

    private openDeeplink: (method: string, id: string, params: any) => void;

    public init({
        manifest,
        connectSrc,
        deeplinkOpen,
        deeplinkCallbackUrl,
    }: ConnectSettingsMobile) {
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

        this._manifest = parseManifest(manifest);

        const validConnectSrc =
            connectSrc === 'trezorsuite://connect' ? connectSrc : corsValidator(connectSrc);

        this.openDeeplink = (method, id, params) => {
            const url = buildUrl({
                method,
                id,
                params,
                connectSrc: validConnectSrc,
                callbackUrl: deeplinkCallbackUrl,
                manifest: this._manifest,
            });
            deeplinkOpen(url);
        };

        return Promise.resolve();
    }

    public call(params: CallMethodPayload) {
        this.messageID++;
        this.messagePromises[this.messageID] = createDeferred();
        const { method, ...restParams } = params;

        this.openDeeplink(method, this.messageID.toString(), restParams);

        return this.messagePromises[this.messageID].promise;
    }

    public uiResponse() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    public cancel(error?: string) {
        this.resolveMessagePromises({
            success: false,
            error,
        });
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this._manifest = undefined; // TODO and the rest?

        return Promise.resolve(undefined);
    }

    public handleDeeplink(url: string): void {
        let id;
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
            id = parsedUrl.searchParams.get('id');
            if (!id || isNaN(Number(id))) throw new Error('Missing `id` parameter.');
            id = Number(id);
        } catch (error) {
            this.resolveMessagePromises({
                success: false,
                error,
            });

            return;
        }

        if (!this.messagePromises[id]) {
            // Most likely old ID, ignore
            return;
        }

        const responseParam = parsedUrl.searchParams.get('response');
        if (!responseParam) {
            this.messagePromises[id].resolve({
                id,
                success: false,
                error: 'The provided url is missing `response` parameter.',
            });
            delete this.messagePromises[id];

            return;
        }

        let parsedParams;
        try {
            parsedParams = JSON.parse(responseParam);
        } catch {
            /* empty */
        }

        if (!parsedParams) {
            this.messagePromises[id].resolve({
                id,
                success: false,
                error: 'Error parsing deeplink params.',
            });
            delete this.messagePromises[id];
        }

        const { success, payload } = parsedParams;
        this.messagePromises[id].resolve({ id, payload, success });
        delete this.messagePromises[id];
    }

    private resolveMessagePromises(resolvePayload: Record<string, any>) {
        Object.keys(this.messagePromises).forEach(id => {
            this.messagePromises[id as any].resolve({
                id,
                payload: resolvePayload,
            });
            delete this.messagePromises[id as any];
        });
    }
}

const impl = new TrezorConnectDeeplink();
const TrezorConnect = factory<ConnectSettingsMobile, { handleDeeplink: (url: string) => void }>(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        setTransports: impl.setTransports.bind(impl),
        manifest: impl.manifest.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {
        handleDeeplink: impl.handleDeeplink.bind(impl),
    },
);

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
