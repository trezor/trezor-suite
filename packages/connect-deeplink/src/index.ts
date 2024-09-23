import EventEmitter from 'events';

import * as ERRORS from '@trezor/connect/src/constants/errors';
import { parseConnectSettings } from '@trezor/connect/src/data/connectSettings';
import type { CallMethodPayload } from '@trezor/connect/src/events/call';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { TrezorConnect as TrezorConnectType } from '@trezor/connect/src/types';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
import { Deferred, createDeferred } from '@trezor/utils';

export class TrezorConnectDeeplink implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    private _settings: ConnectSettings;
    private messagePromises: Record<number, Deferred<any>> = {};
    private messageID = 0;
    private defaultDeeplinkUrl = 'trezorsuitelite://connect';

    public constructor() {
        this._settings = {
            ...parseConnectSettings(),
            deeplinkOpen: () => {
                throw ERRORS.TypedError('Init_NotInitialized');
            },
        };
    }

    public manifest(manifest: Manifest) {
        this._settings = {
            ...this._settings,
            ...parseConnectSettings({
                ...this._settings,
                manifest,
            }),
        };
    }

    public init(settings: Partial<ConnectSettingsPublic>) {
        if (!settings.deeplinkOpen) {
            throw new Error('TrezorConnect native requires "deeplinkOpen" setting.');
        }
        this._settings = {
            ...parseConnectSettings({ ...this._settings, ...settings }),
            deeplinkOpen: settings.deeplinkOpen,
            deeplinkCallbackUrl: settings.deeplinkCallbackUrl,
            deeplinkUrl: settings.deeplinkUrl || this.defaultDeeplinkUrl,
        };

        return Promise.resolve();
    }

    public call(params: CallMethodPayload) {
        this.messageID++;
        this.messagePromises[this.messageID] = createDeferred();
        const { method, ...restParams } = params;
        if (!this._settings) {
            throw new Error('TrezorConnect not initialized.');
        }
        if (!this._settings.deeplinkOpen) {
            throw new Error('TrezorConnect native requires "deeplinkOpen" setting.');
        }
        if (!this._settings.deeplinkCallbackUrl) {
            throw new Error('TrezorConnect native requires "deeplinkCallbackUrl" setting.');
        }
        const callbackUrl = this.buildCallbackUrl(this._settings.deeplinkCallbackUrl, {
            id: this.messageID,
        });
        const url = this.buildUrl(method, restParams, callbackUrl);
        this._settings.deeplinkOpen(url);

        return this.messagePromises[this.messageID].promise;
    }

    public requestLogin(): Response<Login> {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    public uiResponse() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    public renderWebUSBButton() {}

    public disableWebUSB() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    public requestWebUSBDevice() {
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
        this._settings = parseConnectSettings();

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
        } catch {}

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

    resolveMessagePromises(resolvePayload: Record<string, any>) {
        Object.keys(this.messagePromises).forEach(id => {
            this.messagePromises[id as any].resolve({
                id,
                payload: resolvePayload,
            });
            delete this.messagePromises[id as any];
        });
    }

    private buildUrl(method: string, params: any, callback: string) {
        return `${this._settings.deeplinkUrl}?method=${method}&params=${encodeURIComponent(
            JSON.stringify(params),
        )}&callback=${encodeURIComponent(callback)}`;
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
const TrezorConnect: TrezorConnectType & {
    handleDeeplink: (url: string) => void;
} = {
    ...factory({
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        manifest: impl.manifest.bind(impl),
        requestLogin: impl.requestLogin.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        renderWebUSBButton: impl.renderWebUSBButton.bind(impl),
        disableWebUSB: impl.disableWebUSB.bind(impl),
        requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    }),
    handleDeeplink: impl.handleDeeplink.bind(impl),
};

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
