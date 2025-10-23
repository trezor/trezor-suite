import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import * as ERRORS from '@trezor/connect/src/constants/errors';
import {
    CallMethodAnyResponse,
    CallMethodPayload,
    UiResponseEvent,
    createErrorMessage,
} from '@trezor/connect/src/events';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type {
    ConnectSettings,
    ConnectSettingsWeb,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { InitFullSettings } from '@trezor/connect/src/types/api/init';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import { Deferred, createDeferred, createDeferredManager } from '@trezor/utils';

import { parseConnectSettings } from '../connectSettings';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteWeb implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;

    protected logger: Log;

    private _popup?: WindowProxy;
    private _popupLoaded?: Deferred<void>;
    private _responsePromises = createDeferredManager<CallMethodAnyResponse>();

    public constructor() {
        this._settings = parseConnectSettings();
        this.logger = initLog('@trezor/connect-web');

        if (typeof window === 'undefined' || !window) return;
        window.addEventListener('message', (event: MessageEvent) => {
            this.logger.debug('window: message event', event.data);
            if (event.data?.type === 'connect-popup/ready') {
                this._popupLoaded?.resolve();
            }
            if (event.data?.type === 'connect-popup/response') {
                this._responsePromises.resolve(event.data.id, event.data);
            }
        });
    }

    public manifest(data: Manifest) {
        this._settings = parseConnectSettings({
            ...this._settings,
            manifest: data,
        });
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this._settings = parseConnectSettings();

        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {
        this._popup?.postMessage(
            {
                type: 'connect-popup/cancel',
            },
            '*',
        );
    }

    public init(settings: InitFullSettings<{}>): Promise<void> {
        this._settings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });
        this.logger.enabled = !!this._settings.debug;

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        this.logger.debug('initiated');

        return Promise.resolve();
    }

    public setTransports() {
        // not supported, transports are controlled by suite.
        throw new Error('Unsupported');
    }

    private getSuiteUrl() {
        if (this._settings.connectSrc?.startsWith('http://localhost')) {
            return 'http://localhost:8000/connect-popup';
        }
        if (this._settings.connectSrc?.startsWith('https://dev.suite.sldev.cz/connect/')) {
            const branch = this._settings.connectSrc?.replace(
                'https://dev.suite.sldev.cz/connect/',
                '',
            );

            return `https://dev.suite.sldev.cz/suite-web/${branch}web/connect-popup`;
        }

        return 'https://suite.trezor.io/web/connect-popup';
    }

    /**
     * 1. opens popup
     * 2. sends request to popup where the request is handled by core
     * 3. returns response
     */
    public async call(params: CallMethodPayload): Promise<CallMethodAnyResponse> {
        this.logger.debug('call', params);

        if (!this._popup || this._popup.closed) {
            this._popup = window.open(this.getSuiteUrl(), 'trezor-connect-popup') || undefined;

            if (!this._popup) {
                throw ERRORS.TypedError('Init_NotInitialized');
            }
            this.logger.debug('call: opening popup');
            // wait for popup to load
            this._popupLoaded = createDeferred<void>();
            /*setTimeout(() => {
                popupLoaded.reject(ERRORS.TypedError('Init_NotInitialized'));
            }, 10000);*/
            this.logger.debug('call: popup waiting for ready message');
            await this._popupLoaded.promise;
            this.logger.debug('call: popup loaded');
        }

        try {
            // post message to core in popup
            const { promiseId, promise } = this._responsePromises.create();
            this._popup.postMessage(
                {
                    id: promiseId,
                    type: 'connect-popup/call',
                    method: params.method,
                    payload: params,
                    manifest: this._settings.manifest,
                },
                '*',
            );

            const response = await promise;
            this.logger.debug('call: response: ', response);

            if (!response) {
                throw ERRORS.TypedError('Method_NoResponse');
            }

            return response;
        } catch (error) {
            this.logger.error('call: error', error);

            return createErrorMessage(error);
        }
    }

    // this shouldn't be needed, ui response should be handled in suite-desktop
    uiResponse(_response: UiResponseEvent) {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // todo: not supported yet
    requestLogin(): Response<Login> {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // not needed, only because of types
    disableWebUSB() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // not needed, only because of types
    requestWebUSBDevice() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // not needed, only because of types
    renderWebUSBButton() {}
}

const impl = new CoreInSuiteWeb();

// Exported to enable using directly
export const TrezorConnect = factory({
    // Bind all methods due to shadowing `this`
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    setTransports: impl.setTransports.bind(impl),
    manifest: impl.manifest.bind(impl),
    requestLogin: impl.requestLogin.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});
