import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    IFRAME,
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

import { parseConnectSettings } from '../connectSettings';
import { Login } from '@trezor/connect/src/types/api/requestLogin';
// import { createDeferred } from '@trezor/utils';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteDesktop implements ConnectFactoryDependencies {
    public eventEmitter = new EventEmitter();
    protected _settings: ConnectSettings;
    private ws?: WebSocket;

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

        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {}

    public init(settings: Partial<ConnectSettingsPublic> = {}): Promise<void> {
        const newSettings = parseConnectSettings({
            ...this._settings,
            ...settings,
        });

        // defaults
        if (!newSettings.transports?.length) {
            newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }
        this._settings = newSettings;

        this.ws = new WebSocket('ws://localhost:8090');
        this.ws.addEventListener('error', console.error);
        this.ws.addEventListener('open', function open() {});

        return Promise.resolve();
    }

    /**
     * 1. opens popup
     * 2. sends request to popup where the request is handled by core
     * 3. returns response
     */
    public async call(params: CallMethodPayload): Promise<CallMethodAnyResponse> {
        this.ws?.send(
            JSON.stringify({
                type: IFRAME.CALL,
                payload: params,
            }),
        );

        return new Promise(resolve => {
            this.ws?.addEventListener('message', function message(event) {
                console.log('received: %s', event.data);
                resolve(JSON.parse(event.data));
            });
        });
    }

    uiResponse(_response: UiResponseEvent) {
        // this shouldn't be needed, ui response should be handled in suite-desktop
        throw ERRORS.TypedError('Method_InvalidPackage');
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

const impl = new CoreInSuiteDesktop();

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
