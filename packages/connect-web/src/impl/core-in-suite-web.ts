import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import * as ERRORS from '@trezor/connect/src/constants/errors';
import {
    CallMethodAnyResponse,
    CallMethodPayload,
    DEVICE_EVENT,
    IFRAME,
    POPUP,
    UiResponseEvent,
    createErrorMessage,
} from '@trezor/connect/src/events';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import type { ConnectSettingsWeb, Manifest } from '@trezor/connect/src/types';
import { Log, initLog } from '@trezor/connect/src/utils/debug';

import {
    InitParams,
    getEnv,
    getGlobalConnectSrc,
    getPopupSrc,
    parseBoolSetting,
    parseManifest,
} from '../connectSettings';
import { PopupManager } from '../popup';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteWeb implements ConnectFactoryDependencies<ConnectSettingsWeb> {
    public eventEmitter = new EventEmitter();
    private _popupManager?: PopupManager;
    private env: ReturnType<typeof getEnv>;
    private _manifest: Manifest | undefined;

    protected logger: Log;

    public constructor() {
        this.env = getEnv();
        this.logger = initLog('@trezor/connect-web');
    }

    public manifest(data: Manifest) {
        this._manifest = parseManifest(data);
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this._manifest = undefined;

        return Promise.resolve(undefined);
    }

    public init({ manifest, connectSrc, debug }: InitParams): Promise<void> {
        const globalSrc = getGlobalConnectSrc();
        const _debug = parseBoolSetting({ debug }, 'debug');
        this._manifest = parseManifest(manifest);
        const popupSrc = getPopupSrc(globalSrc || connectSrc);

        this.logger.enabled = !!globalSrc || !!_debug;

        if (!this._manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        if (!this._popupManager) {
            this._popupManager = new PopupManager({
                manifest: this._manifest,
                env: this.env,
                popupSrc,
                logger: this.logger,
            });
            this._popupManager.on(DEVICE_EVENT, event => {
                this.eventEmitter.emit(DEVICE_EVENT, event);
            });
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
        await this._popupManager.request();
        await this._popupManager.channel.init();
        await this._popupManager.handshakePromise?.promise;

        try {
            // post message to core in popup
            const response = await this._popupManager.channel.postMessage({
                type: IFRAME.CALL,
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
