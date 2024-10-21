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
    createErrorMessage,
    UiResponseEvent,
    CoreEventMessage,
    CallMethodPayload,
    CORE_EVENT,
} from '@trezor/connect/src/events';
import type { ConnectSettings, DeviceIdentity, Manifest } from '@trezor/connect/src/types';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import { DeferredManager, createDeferredManager } from '@trezor/utils/src/createDeferredManager';

import webUSBButton from '../webusb/button';
import { parseConnectSettings } from '../connectSettings';

export class CoreInModule implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;

    private _log: Log;
    private _coreManager?: any;
    private _messagePromises: DeferredManager<{
        id: number;
        success: boolean;
        payload: any;
        device?: DeviceIdentity;
    }>;

    private readonly boundOnCoreEvent = this.onCoreEvent.bind(this);

    public constructor() {
        this._settings = parseConnectSettings();
        this._log = initLog('@trezor/connect-web');
        this._messagePromises = createDeferredManager({ initialId: 1 });
    }

    private async initCoreManager() {
        const connectSrc = this._settings.connectSrc;
        const { initCoreState, initTransport } = await import(
            /* webpackIgnore: true */ `${connectSrc}js/core.js`
        ).catch(_err => {
            this._log.error('_err', _err);
        });

        if (!initCoreState) return;

        if (initTransport) {
            this._log.debug('initiating transport with settings: ', this._settings);
            await initTransport(this._settings);
        }

        this._coreManager = initCoreState();
        return this._coreManager;
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
        if (this._coreManager) {
            this._coreManager.dispose();
        }

        return Promise.resolve(undefined);
    }

    public cancel(error?: string) {
        if (this._coreManager) {
            const core = this._coreManager.get();
            if (!core) {
                throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
            }

            core.handleMessage({
                type: POPUP.CLOSED,
                payload: error ? { error } : null,
            });
        }
    }

    // handle message received from Core
    private onCoreEvent(message: CoreEventMessage) {
        const { event, type, payload } = message;

        if (type === UI.REQUEST_UI_WINDOW) {
            this._coreManager.get()?.handleMessage({ type: POPUP.HANDSHAKE });

            return;
        }

        if (type === POPUP.CANCEL_POPUP_REQUEST) return;

        switch (event) {
            case RESPONSE_EVENT: {
                const { id = 0, success, device } = message;
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
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
                break;

            case TRANSPORT_EVENT:
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            case BLOCKCHAIN_EVENT:
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            case UI_EVENT:
                // pass UI event up
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            default:
                this._log.warn('Undefined message', event, message);
        }
    }

    public async init(settings: Partial<ConnectSettings> = {}) {
        if (this._coreManager && (this._coreManager.get() || this._coreManager.getPending())) {
            throw ERRORS.TypedError('Init_AlreadyInitialized');
        }

        this._settings = parseConnectSettings({ ...this._settings, ...settings });

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        this._settings.lazyLoad = true;

        // defaults for connect-web
        if (!this._settings.transports?.length) {
            this._settings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }

        if (!this._coreManager) {
            this._coreManager = await this.initCoreManager();
            await this._coreManager.getOrInit(this._settings, this.boundOnCoreEvent);
        }

        this._log.enabled = !!this._settings.debug;
    }

    initSettings = (settings: Partial<ConnectSettings> = {}) => {
        this._settings = parseConnectSettings({ ...this._settings, ...settings, popup: false });

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        if (!this._settings.transports?.length) {
            // default fallback for node
            this._settings.transports = ['BridgeTransport'];
        }
    };

    public async initCore() {
        this.initSettings({ lazyLoad: false });

        return this._coreManager.getOrInit(this._settings, this.boundOnCoreEvent);
    }

    public async call(params: CallMethodPayload) {
        let core;
        try {
            core =
                this._coreManager.get() ??
                (await this._coreManager.getPending()) ??
                (await this.initCore());
        } catch (error) {
            return createErrorMessage(error);
        }

        try {
            const { promiseId, promise } = this._messagePromises.create();
            core.handleMessage({
                type: IFRAME.CALL,
                payload: params,
                id: promiseId,
            });
            const response = await promise;

            return response ?? createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
        } catch (error) {
            this._log.error('call', error);

            return createErrorMessage(error);
        }
    }

    public uiResponse(response: UiResponseEvent) {
        const core = this._coreManager.get();
        if (!core) {
            throw ERRORS.TypedError('Init_NotInitialized');
        }
        core.handleMessage(response);
    }

    public renderWebUSBButton(className?: string) {
        webUSBButton(className, this._settings.webusbSrc);
    }

    public async requestLogin(params: any) {
        if (typeof params.callback === 'function') {
            const { callback } = params;
            const core = this._coreManager.get();

            // TODO: set message listener only if _core is loaded correctly
            const loginChallengeListener = async (event: MessageEvent<CoreEventMessage>) => {
                const { data } = event;
                if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                    try {
                        const payload = await callback();
                        core?.handleMessage({
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload,
                        });
                    } catch (error) {
                        core?.handleMessage({
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload: error.message,
                        });
                    }
                }
            };

            core?.on(CORE_EVENT, loginChallengeListener);
            const response = await this.call({
                method: 'requestLogin',
                ...params,
                asyncChallenge: true,
                callback: null,
            });
            core?.removeListener(CORE_EVENT, loginChallengeListener);

            return response;
        }

        return this.call({ method: 'requestLogin', ...params });
    }

    public disableWebUSB() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    public async requestWebUSBDevice() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }
}

const impl = new CoreInModule();

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
