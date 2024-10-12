import EventEmitter from 'events';

import {
    POPUP,
    IFRAME,
    UI_EVENT,
    createErrorMessage,
    UiResponseEvent,
    CallMethodPayload,
    CoreEventMessage,
    RESPONSE_EVENT,
    CORE_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI,
} from '../events';
import { Login } from '@trezor/connect/src/types/api/requestLogin';

import * as ERRORS from '@trezor/connect/src/constants/errors';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import {
    initLog,
    //  setLogWriter, LogMessage, LogWriter,
    Log,
} from '@trezor/connect/src/utils/debug';

import { parseConnectSettings } from '../data/connectSettings';
import { createDeferredManager } from '@trezor/utils';

import { initCoreState } from '@trezor/connect/src/core';

const coreManager = initCoreState();
const messagePromises = createDeferredManager({ initialId: 1 });

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInModule implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;

    protected logger: Log;

    public constructor() {
        this._settings = parseConnectSettings();
        this.logger = initLog('@trezor/connect-web');
    }

    // private logWriterFactory(): LogWriter {
    //     return {
    //         add: (message: LogMessage) => {
    //             // popupManager.channel.postMessage(
    //             //     {
    //             //         event: UI_EVENT,
    //             //         type: IFRAME.LOG,
    //             //         payload: message,
    //             //     },
    //             //     { usePromise: false, useQueue: true },
    //             // );
    //         },
    //     };
    // }

    public manifest(data: Manifest) {
        this._settings = parseConnectSettings({
            ...this._settings,
            manifest: data,
        });
    }

    public dispose() {
        // todo: is this defined for all impls?
        this.eventEmitter.removeAllListeners();

        this._settings = parseConnectSettings();
        coreManager.dispose();
    }

    private onCoreEvent(message: CoreEventMessage) {
        const { event, type, payload } = message;

        if (type === UI.REQUEST_UI_WINDOW) {
            coreManager.get()?.handleMessage({ type: POPUP.HANDSHAKE });

            return;
        }

        if (type === POPUP.CANCEL_POPUP_REQUEST) return;

        this.logger.debug('handleMessage', message);

        switch (event) {
            case RESPONSE_EVENT: {
                const { id = 0, success, device } = message;
                const resolved = messagePromises.resolve(id, { id, success, payload, device });
                if (!resolved) this.logger.warn(`Unknown message id ${id}`);
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
                this.logger.warn('Undefined message', event, message);
        }
    }

    private initSettings(settings: Partial<ConnectSettingsPublic> = {}) {
        this._settings = parseConnectSettings({ ...this._settings, ...settings, popup: false });

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        if (!this._settings.transports?.length) {
            // default fallback for node
            this._settings.transports = ['BridgeTransport'];
        }
    }

    public async init(settings: Partial<ConnectSettingsPublic> = {}): Promise<void> {
        if (coreManager.get() || coreManager.getPending()) {
            throw ERRORS.TypedError('Init_AlreadyInitialized');
        }

        this.initSettings(settings);

        if (!this._settings.lazyLoad) {
            await coreManager.getOrInit(this._settings, this.onCoreEvent);
        }
    }

    private initCore() {
        this.initSettings({ lazyLoad: false });

        return coreManager.getOrInit(this._settings, this.onCoreEvent);
    }

    public async call(params: CallMethodPayload) {
        let core;
        try {
            core = coreManager.get() ?? (await coreManager.getPending()) ?? (await this.initCore());
        } catch (error) {
            return createErrorMessage(error);
        }

        try {
            const { promiseId, promise } = messagePromises.create();
            core.handleMessage({
                type: IFRAME.CALL,
                payload: params,
                id: promiseId,
            });
            const response = await promise;

            return response ?? createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
        } catch (error) {
            this.logger.error('call', error);

            return createErrorMessage(error);
        }
    }

    uiResponse(response: UiResponseEvent) {
        const core = coreManager.get();
        if (!core) {
            throw ERRORS.TypedError('Init_NotInitialized');
        }
        core.handleMessage(response);
    }

    async requestLogin(params: any): Response<Login> {
        if (typeof params.callback === 'function') {
            const { callback } = params;
            const core = coreManager.get();

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

    cancel(error?: string) {
        const core = coreManager.get();
        if (!core) {
            throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
        }

        core.handleMessage({
            type: POPUP.CLOSED,
            payload: error ? { error } : null,
        });
    }

    renderWebUSBButton() {}

    disableWebUSB() {}

    requestWebUSBDevice() {}
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
