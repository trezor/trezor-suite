import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    CORE_CALL,
    CallMethodAnyResponse,
    CallMethodPayload,
    DEVICE_EVENT,
    POPUP,
    UiResponseEvent,
    createErrorMessage,
} from '@trezor/connect/src/events';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { ConnectSettings, ConnectSettingsWeb, Manifest } from '@trezor/connect/src/types';
import { InitFullSettings } from '@trezor/connect/src/types/api/init';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';

import { parseConnectSettings } from '../connectSettings';
import { PopupManager } from '../popup';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteWeb implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;
    private _popupManager?: PopupManager;

    protected logger: Log;

    public constructor() {
        this._settings = parseConnectSettings();
        this.logger = initLog('@trezor/connect-web');
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

    public init(settings: InitFullSettings<{}>): Promise<void> {
        this._settings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });
        this.logger.enabled = !!this._settings.debug;

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        if (!this._popupManager) {
            this._popupManager = new PopupManager(
                { ...this._settings, popupSrc: this.getSuiteUrl() },
                {
                    logger: this.logger,
                },
            );
            this._popupManager.on(DEVICE_EVENT, event => {
                this.eventEmitter.emit(DEVICE_EVENT, event);
            });
        }

        this.logger.debug('initiated');

        return Promise.resolve();
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

        if (!this._popupManager) {
            return createErrorMessage(ERRORS.TypedError('Init_NotInitialized'));
        }
        await this._popupManager.request();
        await this._popupManager.channel.init();
        await this._popupManager.handshakePromise?.promise;

        try {
            // post message to core in popup
            const response = await this._popupManager.channel.postMessage({
                type: CORE_CALL,
                payload: params,
            });
            this.logger.debug('call: response: ', response);

            if (!response?.payload) {
                throw ERRORS.TypedError('Method_NoResponse');
            }
            if (response.payload.error && response.payload.code) {
                throw response.payload;
            }

            return {
                success: response.payload.success,
                payload: response.payload.payload,
                device: response.payload.device,
            };
        } catch (error) {
            this.logger.error('call: error', error);

            return createErrorMessage(error);
        }
    }

    public cancel(_error?: string) {
        this._popupManager?.channel?.postMessage({
            type: POPUP.CLOSED,
            payload: { error: _error },
        });
    }

    // not supported, transports are controlled by suite
    public setTransports() {
        throw new Error('Method_InvalidPackage');
    }

    // this shouldn't be needed, ui response should be handled in suite
    uiResponse(_response: UiResponseEvent) {
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
    uiResponse: impl.uiResponse.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});
