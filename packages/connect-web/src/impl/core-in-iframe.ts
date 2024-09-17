import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts
import * as ERRORS from '@trezor/connect/src/constants/errors';
import {
    POPUP,
    IFRAME,
    UI,
    UI_EVENT,
    DEVICE_EVENT,
    RESPONSE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    TRANSPORT,
    parseMessage,
    createErrorMessage,
    UiResponseEvent,
    CoreEventMessage,
    CallMethodPayload,
} from '@trezor/connect/src/events';
import type { ConnectSettings, DeviceIdentity, Manifest } from '@trezor/connect/src/types';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import { config } from '@trezor/connect/src/data/config';
import { DeferredManager, createDeferredManager } from '@trezor/utils/src/createDeferredManager';

import * as iframe from '../iframe';
import * as popup from '../popup';
import webUSBButton from '../webusb/button';
import { parseConnectSettings } from '../connectSettings';

export class CoreInIframe implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;

    private _log: Log;
    private _popupManager?: popup.PopupManager;
    private _messagePromises: DeferredManager<{
        id: number;
        success: boolean;
        payload: any;
        device?: DeviceIdentity;
    }>;

    private readonly boundHandleMessage = this.handleMessage.bind(this);
    private readonly boundDispose = this.dispose.bind(this);

    public constructor() {
        this._settings = parseConnectSettings();
        this._log = initLog('@trezor/connect-web');
        this._messagePromises = createDeferredManager({ initialId: 1 });
    }

    private initPopupManager() {
        const pm = new popup.PopupManager(this._settings, { logger: this._log });
        pm.on(POPUP.CLOSED, (error?: string) => {
            iframe.postMessage({
                type: POPUP.CLOSED,
                payload: error ? { error } : null,
            });
        });

        return pm;
    }

    public manifest(data: Manifest) {
        this._settings = parseConnectSettings({
            ...this._settings,
            manifest: data,
        });
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        iframe.dispose();
        this._settings = parseConnectSettings();
        if (this._popupManager) {
            this._popupManager.close();
        }
        window.removeEventListener('message', this.boundHandleMessage);
        window.removeEventListener('unload', this.boundDispose);

        return Promise.resolve(undefined);
    }

    public cancel(error?: string) {
        if (this._popupManager) {
            this._popupManager.emit(POPUP.CLOSED, error);
        }
    }

    // handle message received from iframe
    private handleMessage(messageEvent: MessageEvent<CoreEventMessage>) {
        // ignore messages from domain other then iframe origin
        if (messageEvent.origin !== iframe.origin) return;

        const message = parseMessage<CoreEventMessage>(messageEvent.data);

        this._log.log('handleMessage', message);

        switch (message.event) {
            case RESPONSE_EVENT: {
                const { id = 0, success, payload, device } = message;
                const resolved = this._messagePromises.resolve(id, {
                    id,
                    success,
                    payload,
                    device,
                });
                if (!resolved) this._log.warn(`Unknown message id ${id}`);
                break;
            }
            case DEVICE_EVENT:
                // pass DEVICE event up to html
                this.eventEmitter.emit(message.event, message);
                this.eventEmitter.emit(message.type, message.payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
                break;

            case TRANSPORT_EVENT:
                this.eventEmitter.emit(message.event, message);
                this.eventEmitter.emit(message.type, message.payload);
                break;

            case BLOCKCHAIN_EVENT:
                this.eventEmitter.emit(message.event, message);
                this.eventEmitter.emit(message.type, message.payload);
                break;

            case UI_EVENT:
                if (message.type === IFRAME.BOOTSTRAP) {
                    iframe.clearTimeout();
                    break;
                }
                if (message.type === IFRAME.LOADED) {
                    iframe.initPromise.resolve();
                }
                if (message.type === IFRAME.ERROR) {
                    iframe.initPromise.reject(message.payload.error as any);
                }

                // pass UI event up
                this.eventEmitter.emit(message.event, message);
                this.eventEmitter.emit(message.type, message.payload);
                break;

            default:
                this._log.log('Undefined message', messageEvent.data);
        }
    }

    public async init(settings: Partial<ConnectSettings> = {}) {
        if (iframe.instance) {
            throw ERRORS.TypedError('Init_AlreadyInitialized');
        }

        this._settings = parseConnectSettings({ ...this._settings, ...settings });

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        // defaults for connect-web
        if (!this._settings.transports?.length) {
            this._settings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }

        if (this._settings.lazyLoad) {
            // reset "lazyLoad" after first use
            this._settings.lazyLoad = false;

            return;
        }

        if (!this._popupManager) {
            this._popupManager = this.initPopupManager();
        }

        this._log.enabled = !!this._settings.debug;

        window.addEventListener('message', this.boundHandleMessage);
        window.addEventListener('unload', this.boundDispose);

        await iframe.init(this._settings);

        if (this._settings.coreMode === 'auto') {
            // Checking bridge availability
            const { promiseId, promise } = this._messagePromises.create();
            this._log.debug('coreMode = auto, Checking bridge availability');
            iframe.postMessage({ id: promiseId, type: TRANSPORT.GET_INFO });
            const response = await promise;
            this._log.debug('Bridge availability response', response);
            if (
                response.payload === undefined &&
                navigator.usb &&
                this._settings.transports?.includes('WebUsbTransport')
            ) {
                throw ERRORS.TypedError('Transport_Missing');
            }
        }

        // sharedLogger can be disable but it is enable by default.
        if (this._settings.sharedLogger !== false) {
            // connect-web is running in third-party domain so we use iframe to pass logs to shared worker.
            iframe.initIframeLogger();
        }
    }

    public async call(params: CallMethodPayload) {
        if (!iframe.instance && !iframe.timeout) {
            // init popup with lazy loading before iframe initialization
            this._settings = parseConnectSettings(this._settings);

            if (!this._settings.manifest) {
                return createErrorMessage(ERRORS.TypedError('Init_ManifestMissing'));
            }

            if (!this._popupManager) {
                this._popupManager = this.initPopupManager();
            }

            // auto init with default settings
            try {
                await this.init(this._settings);
            } catch (error) {
                if (this._popupManager) {
                    this._popupManager.clear();
                }

                return createErrorMessage(error);
            }
        }

        if (iframe.timeout) {
            // this.init was called, but iframe doesn't return handshake yet
            await iframe.initPromise.promise;
        }

        if (iframe.error) {
            // iframe was initialized with error
            return createErrorMessage(iframe.error);
        }

        // request popup window it might be used in the future
        if (this._settings.popup && this._popupManager) {
            this._popupManager.request();
        }

        // post message to iframe
        try {
            const { promiseId, promise } = this._messagePromises.create();
            iframe.postMessage({ id: promiseId, type: IFRAME.CALL, payload: params });
            const response = await promise;
            if (response) {
                if (
                    !response.success &&
                    response.payload.code !== 'Device_CallInProgress' &&
                    this._popupManager
                ) {
                    this._popupManager.unlock();
                }

                return response;
            }
            if (this._popupManager) {
                this._popupManager.unlock();
            }

            return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
        } catch (error) {
            this._log.error('__call error', error);
            if (this._popupManager) {
                this._popupManager.clear(false);
            }

            return createErrorMessage(error);
        }
    }

    public uiResponse(response: UiResponseEvent) {
        if (!iframe.instance) {
            throw ERRORS.TypedError('Init_NotInitialized');
        }
        iframe.postMessage(response);
    }

    public renderWebUSBButton(className?: string) {
        webUSBButton(className, this._settings.webusbSrc);
    }

    public async requestLogin(params: any) {
        if (typeof params.callback === 'function') {
            const { callback } = params;

            // TODO: set message listener only if iframe is loaded correctly
            const loginChallengeListener = async (event: MessageEvent<CoreEventMessage>) => {
                const { data } = event;
                if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                    try {
                        const payload = await callback();
                        iframe.postMessage({
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload,
                        });
                    } catch (error) {
                        iframe.postMessage({
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload: error.message,
                        });
                    }
                }
            };

            window.addEventListener('message', loginChallengeListener, false);

            const response = await this.call({
                method: 'requestLogin',
                ...params,
                asyncChallenge: true,
                callback: null,
            });
            window.removeEventListener('message', loginChallengeListener);

            return response;
        }

        return this.call({ method: 'requestLogin', ...params });
    }

    public disableWebUSB() {
        if (!iframe.instance) {
            throw ERRORS.TypedError('Init_NotInitialized');
        }
        iframe.postMessage({ type: TRANSPORT.DISABLE_WEBUSB });
    }

    /**
     * Initiate device pairing procedure.
     */
    public async requestWebUSBDevice() {
        try {
            await window.navigator.usb.requestDevice({ filters: config.webusb });
            iframe.postMessage({ type: TRANSPORT.REQUEST_DEVICE });
        } catch (_err) {
            // user hits cancel gets "DOMException: No device selected."
            // no need to log this
        }
    }
}

const impl = new CoreInIframe();

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
