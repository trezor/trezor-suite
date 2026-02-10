import { corsValidator, parseManifest } from '@trezor/connect/src/data/connectSettings';
import { createErrorMessage } from '@trezor/connect/src/events';
import type { CallMethodPayload } from '@trezor/connect/src/events/call';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { Manifest } from '@trezor/connect/src/types';
import type { UpdateConnectSettings } from '@trezor/connect/src/types/api/updateConnectSettings';
import { ConnectEmitter } from '@trezor/connect/src/types/emitter';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import {
    DEEPLINK_VERSION,
    DEFAULT_DOMAIN,
    DEFAULT_DOMAIN_MAJOR_VER,
} from '@trezor/connect-common/src/data/version';
import { Deferred, createDeferred, removeTrailingSlashes } from '@trezor/utils';

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
    private deeplinkUrl: string = `${DEFAULT_DOMAIN}deeplink/${DEEPLINK_VERSION}/`;
    private deeplinkCallbackUrl?: string;
    private deeplinkOpen?: (url: string) => void;

    public updateConnectSettings(_params: UpdateConnectSettings) {
        return Promise.resolve(createErrorMessage(ERRORS.TypedError('Method_InvalidPackage')));
    }

    private validateConnectSrc(connectSrc?: string) {
        if (!connectSrc) return DEFAULT_DOMAIN_MAJOR_VER;
        if (connectSrc === 'trezorsuite://connect') return connectSrc;

        return corsValidator(connectSrc);
    }

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

        this.deeplinkUrl = `${removeTrailingSlashes(this.validateConnectSrc(connectSrc))}/deeplink/${DEEPLINK_VERSION}/`;
        this.deeplinkOpen = deeplinkOpen;
        this.deeplinkCallbackUrl = deeplinkCallbackUrl;

        return Promise.resolve();
    }

    public call(params: CallMethodPayload) {
        this.messageID++;
        this.messagePromises[this.messageID] = createDeferred();
        const { method, ...restParams } = params;
        if (!this.deeplinkOpen) {
            throw new Error('TrezorConnect native requires "deeplinkOpen" setting.');
        }
        if (!this.deeplinkCallbackUrl) {
            throw new Error('TrezorConnect native requires "deeplinkCallbackUrl" setting.');
        }
        const callbackUrl = this.buildCallbackUrl(this.deeplinkCallbackUrl, {
            id: this.messageID,
        });
        const url = this.buildUrl(method, restParams, callbackUrl);
        this.deeplinkOpen(url);

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

    private buildUrl(method: string, params: any, callback: string) {
        let url =
            `${this.deeplinkUrl}` +
            `?method=${method}` +
            `&params=${encodeURIComponent(JSON.stringify(params))}` +
            `&callback=${encodeURIComponent(callback)}`;
        if (this.manifest?.appName) {
            url += `&appName=${encodeURIComponent(this.manifest.appName)}`;
        }
        if (this.manifest?.appIcon) {
            url += `&appIcon=${encodeURIComponent(this.manifest.appIcon)}`;
        }

        return url;
    }

    private buildCallbackUrl(url: string, params: Record<string, string | number>) {
        try {
            const urlWithParams = new URL(url);
            Object.entries(params).forEach(([key, value]) => {
                urlWithParams.searchParams.set(key, value.toString());
            });

            return urlWithParams.toString();
        } catch {
            throw new Error('Provided "deeplinkCallbackUrl" is not valid.');
        }
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
