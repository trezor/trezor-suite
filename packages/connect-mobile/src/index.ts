import { corsValidator, parseManifest } from '@trezor/connect/src/data/connectSettings';
import type { CallMethodPayload } from '@trezor/connect/src/events/call';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { UpdateConnectSettings } from '@trezor/connect/src/types/api/updateConnectSettings';
import type { Manifest } from '@trezor/connect-common';
import { ConnectEmitter , createErrorMessage } from '@trezor/connect-common';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import {
    DEEPLINK_VERSION,
    DEFAULT_DOMAIN_MAJOR_VER,
} from '@trezor/connect-common/src/data/version';
import { Deferred, createDeferred, removeTrailingSlashes } from '@trezor/utils';

type BuildUrlParams = {
    method: string;
    id: number;
    params: any;
    connectSrc: string | undefined;
    callbackUrl: string;
    manifest?: Manifest;
};

const buildUrl = ({ method, id, params, connectSrc, callbackUrl, manifest }: BuildUrlParams) => {
    const urlWithParams = new URL(callbackUrl);
    urlWithParams.searchParams.set('id', id.toString());

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

interface ConnectSettingsMobile {
    manifest: Manifest;
    coreMode?: 'deeplink';
    connectSrc?: string;
    deeplinkOpen: (url: string) => void;
    deeplinkCallbackUrl: string;
}

export class TrezorConnectDeeplink implements ConnectFactoryDependencies<ConnectSettingsMobile> {
    public eventEmitter = new ConnectEmitter();
    private messagePromises: Record<number, Deferred<any>> = {};
    private messageID = 0;

    private manifest?: Manifest;

    public updateConnectSettings(_params: UpdateConnectSettings) {
        return Promise.resolve(createErrorMessage(ERRORS.TypedError('Method_InvalidPackage')));
    }

    private openDeeplink: (method: string, id: number, params: any) => void = () => {
        throw ERRORS.TypedError('Init_NotInitialized');
    };

    public init({
        manifest,
        connectSrc,
        deeplinkOpen,
        deeplinkCallbackUrl,
    }: ConnectSettingsMobile) {
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
        this.messageID++;
        this.messagePromises[this.messageID] = createDeferred();
        const { method, ...restParams } = params;

        this.openDeeplink(method, this.messageID, restParams);

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
        uiResponse: impl.uiResponse.bind(impl),
        updateConnectSettings: impl.updateConnectSettings.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    { handleDeeplink: impl.handleDeeplink.bind(impl) },
);

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
