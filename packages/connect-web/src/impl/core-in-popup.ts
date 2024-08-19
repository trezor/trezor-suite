import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    POPUP,
    IFRAME,
    UI_EVENT,
    createErrorMessage,
    UiResponseEvent,
    CallMethodPayload,
    CallMethodAnyResponse,
} from '@trezor/connect/src/events';
import * as ERRORS from '@trezor/connect/src/constants/errors';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { initLog, setLogWriter, LogMessage, LogWriter, Log } from '@trezor/connect/src/utils/debug';
import * as popup from '../popup';

import { parseConnectSettings } from '../connectSettings';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
import { createDeferred } from '@trezor/utils';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInPopup implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;

    protected logger: Log;
    protected popupManagerLogger: Log;
    private _popupManager?: popup.PopupManager;

    public constructor() {
        this._settings = parseConnectSettings();
        this.logger = initLog('@trezor/connect-web');
        this.popupManagerLogger = initLog('@trezor/connect-web/popupManager');
    }

    private logWriterFactory(popupManager: popup.PopupManager): LogWriter {
        return {
            add: (message: LogMessage) => {
                popupManager.channel.postMessage(
                    {
                        event: UI_EVENT,
                        type: IFRAME.LOG,
                        payload: message,
                    },
                    { usePromise: false, useQueue: true },
                );
            },
        };
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
        if (this._popupManager) {
            this._popupManager.close();
        }

        return Promise.resolve(undefined);
    }

    public cancel(error?: string) {
        if (this._popupManager) {
            this._popupManager.emit(POPUP.CLOSED, error);
        }
    }

    public init(settings: Partial<ConnectSettingsPublic> = {}): Promise<void> {
        const oldSettings = parseConnectSettings({
            ...this._settings,
        });
        const newSettings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });

        // defaults
        if (!newSettings.transports?.length) {
            newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }
        newSettings.useCoreInPopup = true;
        if (typeof window !== 'undefined' && window?.location?.origin) {
            newSettings.origin = window.location.origin;
        }
        const equalSettings = JSON.stringify(oldSettings) === JSON.stringify(newSettings);
        this._settings = newSettings;

        if (!this._popupManager || !equalSettings) {
            if (this._popupManager) this._popupManager.close();
            this._popupManager = new popup.PopupManager(this._settings, {
                logger: this.popupManagerLogger,
            });
            setLogWriter(() => this.logWriterFactory(this._popupManager!));
        }

        this.logger.enabled = !!settings.debug;

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        this.logger.debug('initiated');

        return Promise.resolve();
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

        // request popup window it might be used in the future
        if (this._settings.popup) {
            await this._popupManager.request();
        }

        // We need to handle the case when the popup is closed during initialization
        // In this case, we need to listen to the POPUP.CLOSED event and return an error
        const popupClosed = createDeferred();
        const popupClosedHandler = () => {
            this.logger.log('Popup closed during initialization');
            popupClosed.reject(ERRORS.TypedError('Method_Interrupted'));
        };
        this._popupManager.once(POPUP.CLOSED, popupClosedHandler);

        try {
            this.logger.debug('call: popup initialing');
            await Promise.race([popupClosed.promise, this.callInit()]);
            this.logger.debug('call: popup initialized');

            // post message to core in popup
            const response = await this._popupManager.channel.postMessage({
                type: IFRAME.CALL,
                payload: params,
            });

            this.logger.debug('call: response: ', response);

            if (response) {
                if (this._popupManager && response.success) {
                    this._popupManager.clear();
                }

                return response;
            }

            throw ERRORS.TypedError('Method_NoResponse');
        } catch (error) {
            this.logger.error('call: error', error);
            this._popupManager.clear(false);

            return createErrorMessage(error);
        } finally {
            this._popupManager.removeListener(POPUP.CLOSED, popupClosedHandler);
        }
    }

    private async callInit(): Promise<void> {
        if (!this._popupManager) {
            throw ERRORS.TypedError('Init_NotInitialized');
        }

        await this._popupManager.channel.init();

        if (this._settings.env === 'webextension') {
            // In webextension we init based on the popup promise
            // In core this is handled in the popup manager
            await this._popupManager.popupPromise?.promise;

            this._popupManager.channel.postMessage({
                type: POPUP.INIT,
                payload: {
                    settings: this._settings,
                    useCore: true,
                },
            });
        }

        await this._popupManager.handshakePromise?.promise;
    }

    uiResponse(response: UiResponseEvent) {
        const { type, payload } = response;
        this._popupManager?.channel?.postMessage({ event: UI_EVENT, type, payload });
    }

    renderWebUSBButton() {}

    requestLogin(): Response<Login> {
        // todo: not supported yet
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    disableWebUSB() {
        // todo: not supported yet, probably not needed
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    requestWebUSBDevice() {
        // not needed - webusb pairing happens in popup
        throw ERRORS.TypedError('Method_InvalidPackage');
    }
}

const impl = new CoreInPopup();

// Exported to enable using directly
export const TrezorConnect = factory({
    // Bind all methods due to shadowing `this`
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
});
