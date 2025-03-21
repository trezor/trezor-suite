import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import * as ERRORS from '@trezor/connect/src/constants/errors';
import {
    CallMethodAnyResponse,
    CallMethodPayload,
    IFRAME,
    POPUP,
    UiResponseEvent,
} from '@trezor/connect/src/events';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    ConnectSettingsWeb,
    Manifest,
    Response,
} from '@trezor/connect/src/types';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
import { WebsocketClient } from '@trezor/websocket-client';
import { WebsocketError } from '@trezor/websocket-client/src/client';

import { parseConnectSettings } from '../connectSettings';

/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
export class CoreInSuiteDesktop implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;
    private ws?: WebsocketClient<{}>;

    public constructor() {
        this._settings = parseConnectSettings();
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
        this.ws?.dispose();

        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {}

    private async handshake() {
        try {
            const response = await this.ws!.sendMessage(
                {
                    type: POPUP.HANDSHAKE,
                },
                {
                    timeout: 1000,
                },
            );

            if (!response) {
                throw ERRORS.TypedError('Desktop_ConnectionMissing', 'No response');
            }

            return response;
        } catch (err) {
            throw ERRORS.TypedError('Desktop_ConnectionMissing', err.message);
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

        try {
            this.ws = new WebsocketClient({ url: 'ws://localhost:21335/connect-ws' });

            await this.ws.connect();

            return await this.handshake();
        } catch (err) {
            throw err instanceof WebsocketError
                ? ERRORS.TypedError('Desktop_ConnectionMissing', err.message)
                : err;
        }
    }

    public setTransports() {
        // not supported, transports are controlled by suite-desktop.
        throw new Error('Unsupported');
    }

    public async call(params: CallMethodPayload): Promise<CallMethodAnyResponse> {
        try {
            if (!this.ws) {
                await this.init();
            } else {
                await this.handshake();
            }

            const response = await this.ws?.sendMessage(
                {
                    type: IFRAME.CALL,
                    payload: params,
                },
                {
                    timeout: Number.MAX_SAFE_INTEGER,
                },
            );

            if (!response) {
                throw ERRORS.TypedError('Desktop_ConnectionMissing', 'No response');
            }

            return response;
        } catch (err) {
            return {
                success: false,
                payload: ERRORS.serializeError(
                    err instanceof WebsocketError
                        ? ERRORS.TypedError('Desktop_ConnectionMissing', err.message)
                        : err,
                ),
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
