import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    IFRAME,
    UiResponseEvent,
    CallMethodPayload,
    CallMethodAnyResponse,
    POPUP,
} from '@trezor/connect/src/events';
import * as ERRORS from '@trezor/connect/src/constants/errors';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    ConnectSettingsWeb,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
import { createDeferred, createDeferredManager, DeferredManager } from '@trezor/utils';

import { parseConnectSettings } from '../connectSettings';

/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
export class CoreInSuiteDesktop implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;
    private ws?: WebSocket;
    private readonly messages: DeferredManager<CallMethodAnyResponse>;

    public constructor() {
        this._settings = parseConnectSettings();
        this.messages = createDeferredManager();
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
        this.ws?.close();

        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {}

    private async handshake() {
        const { promise, promiseId } = this.messages.create(1000);
        this.ws?.send(
            JSON.stringify({
                id: promiseId,
                type: POPUP.HANDSHAKE,
            }),
        );
        try {
            await promise;
        } catch (err) {
            console.error(err);
            throw new Error('Handshake timed out');
        }
    }

    public async init(settings: Partial<ConnectSettingsPublic> = {}): Promise<void> {
        const newSettings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });

        // defaults
        if (!newSettings.transports?.length) {
            newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }
        this._settings = newSettings;

        this.ws?.close();
        const wsOpen = createDeferred(1000);
        this.ws = new WebSocket('ws://localhost:21335/connect-ws');
        this.ws.addEventListener('opened', () => {
            wsOpen.resolve();
        });
        this.ws.addEventListener('error', () => {
            wsOpen.reject(new Error('WebSocket error'));
            this.messages.rejectAll(new Error('WebSocket error'));
        });
        this.ws.addEventListener('message', (event: WebSocketEventMap['message']) => {
            try {
                const data = JSON.parse(event.data);
                this.messages.resolve(data.id, data);
            } catch {
                // Some undefined message format
            }
        });
        this.ws.addEventListener('close', () => {
            wsOpen.reject(new Error('WebSocket closed'));
            this.messages.rejectAll(new Error('WebSocket closed'));
        });

        // Wait for the connection to be opened
        if (this.ws.readyState !== WebSocket.OPEN) {
            // There is some glitch that when reconnecting the open event doesn't fire
            // So we do this as a workaround
            setTimeout(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    wsOpen.resolve();
                }
            }, 500);
            await wsOpen.promise;
        }

        return await this.handshake();
    }

    public setTransports() {
        // TODO: implement
        throw new Error('Unsupported right now');
    }

    /**
     * 1. opens popup
     * 2. sends request to popup where the request is handled by core
     * 3. returns response
     */
    public async call(params: CallMethodPayload): Promise<CallMethodAnyResponse> {
        try {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                await this.init();
            }
            await this.handshake();

            const { promise, promiseId } = this.messages.create();

            this.ws?.send(
                JSON.stringify({
                    id: promiseId,
                    type: IFRAME.CALL,
                    payload: params,
                }),
            );

            return promise;
        } catch (err) {
            return {
                success: false,
                payload: {
                    error: err.message,
                },
            };
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

    // todo: not needed, only because of types
    disableWebUSB() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // todo: not needed, only because of types
    requestWebUSBDevice() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }

    // todo: not needed, only because of types
    renderWebUSBButton() {}
}

const impl = new CoreInSuiteDesktop();

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
