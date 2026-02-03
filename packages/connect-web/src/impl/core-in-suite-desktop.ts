import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    CORE_CALL,
    CallMethodAnyResponse,
    CallMethodPayload,
    POPUP,
    UiResponseEvent,
} from '@trezor/connect/src/events';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type {
    ConnectSettings,
    ConnectSettingsPublic,
    ConnectSettingsWeb,
    Manifest,
} from '@trezor/connect/src/types';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { WebsocketClient } from '@trezor/websocket-client';
import { WebsocketError } from '@trezor/websocket-client/src/client';

import { parseConnectSettings } from '../connectSettings';

/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
export class CoreInSuiteDesktop implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;
    private ws: WebsocketClient<{}>;
    private localNetworkPermissionState: PermissionState | 'unknown' = 'unknown';

    public constructor() {
        this._settings = parseConnectSettings();
        this.ws = new WebsocketClient({ url: 'ws://127.0.0.1:21335/connect-ws' });
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
        this.ws.dispose();

        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {
        this.ws.sendMessage({
            type: POPUP.CLOSED,
            payload: { error: _error },
        });
    }

    private async handshake() {
        if (!this.ws) {
            throw ERRORS.TypedError('Desktop_ConnectionMissing', 'No websocket connection');
        }
        try {
            const response = await this.ws.sendMessage(
                {
                    type: POPUP.HANDSHAKE,
                    payload: {
                        settings: this._settings,
                    },
                },
                {
                    // can take a while on slower machines due to loading process info
                    timeout: 3000,
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

    public async init(settings: Partial<ConnectSettingsPublic>): Promise<void> {
        const permission = await navigator.permissions
            .query({
                // @ts-expect-error outdated type definitions
                name: 'local-network-access',
            })
            .catch(() => undefined);
        if (permission) {
            this.localNetworkPermissionState = permission.state;
            permission.onchange = () => {
                this.localNetworkPermissionState = permission.state;
            };
        }

        const newSettings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });

        // manifest is required in all implementations. for core-in-suite-desktop, also manifest.appName is required
        if (!newSettings.manifest || !newSettings.manifest.appName) {
            throw ERRORS.TypedError(
                'Init_ManifestMissing',
                'Manifest is missing or manifest.appName is not set',
            );
        }

        // defaults
        if (!newSettings.transports?.length) {
            newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }
        this._settings = newSettings;

        return await this.connect();
    }

    private error(err: Error): Error {
        if (err instanceof WebsocketError) {
            if (this.localNetworkPermissionState === 'denied') {
                return ERRORS.TypedError('Browser_LocalNetworkPermissionMissing');
            } else {
                return ERRORS.TypedError('Desktop_ConnectionMissing', err.message);
            }
        }

        return err;
    }

    private async connect(): Promise<void> {
        try {
            await this.ws.connect();
        } catch (err) {
            throw this.error(err);
        }
    }

    public setTransports() {
        // not supported, transports are controlled by suite-desktop.
        throw new Error('Method_InvalidPackage');
    }

    public async call(params: CallMethodPayload): Promise<CallMethodAnyResponse> {
        try {
            if (!this.ws.isConnected()) {
                await this.connect();
            }
            await this.handshake();

            const response = await this.ws.sendMessage(
                {
                    type: CORE_CALL,
                    payload: params,
                },
                {
                    // base timeout in WebsocketClient is 20s, setting 0 overrides it.
                    // todo: there should be no base timeout in the websocket client. it is just too opinionated
                    timeout: 0,
                },
            );

            if (!response) {
                throw ERRORS.TypedError('Desktop_ConnectionMissing', 'No response');
            }

            return response;
        } catch (err) {
            return {
                success: false,
                payload: ERRORS.serializeError(this.error(err)),
            };
        }
    }

    // this shouldn't be needed, ui response should be handled in suite-desktop
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

const impl = new CoreInSuiteDesktop();

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
