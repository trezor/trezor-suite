import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import { corsValidator } from '@trezor/connect/src/data/connectSettings';
import {
    CORE_CALL,
    CallMethodAnyResponse,
    CallMethodPayload,
    DEVICE_EVENT,
    POPUP,
    UiResponseEvent,
    createErrorMessage,
} from '@trezor/connect/src/events';
import type { ConnectImpl, ConnectImplSettings } from '@trezor/connect/src/impl/dynamic';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';

import { getEnv, getGlobalConnectSrc } from '../connectSettings';
import { PopupManager } from '../popup';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteWeb implements ConnectImpl {
    public eventEmitter = new EventEmitter();
    private _popupManager?: PopupManager;

    protected logger: Log;

    public constructor() {
        this.logger = initLog('@trezor/connect-web');
    }

    public dispose() {
        return Promise.resolve(undefined);
    }

    public cancel(_error?: string) {
        this._popupManager?.channel?.postMessage({
            type: POPUP.CLOSED,
            payload: { error: _error },
        });
    }

    public init({ env, manifest, version, connectSrc, debug }: ConnectImplSettings): Promise<void> {
        const globalSrc = getGlobalConnectSrc();

        this.logger.enabled = !!debug || !!globalSrc;

        if (!this._popupManager) {
            this._popupManager = new PopupManager({
                manifest,
                version,
                env: env ?? getEnv(),
                popupSrc: this.getSuiteUrl(globalSrc || connectSrc),
                logger: this.logger,
            });
            this._popupManager.on(DEVICE_EVENT, event => {
                this.eventEmitter.emit(DEVICE_EVENT, event);
            });
        }

        this.logger.debug('initiated');

        return Promise.resolve();
    }

    private getSuiteUrl(connectSrc?: string) {
        const valid = corsValidator(connectSrc);

        if (valid?.startsWith('http://localhost')) {
            return 'http://localhost:8000/connect-popup';
        }
        if (valid?.startsWith('https://dev.suite.sldev.cz/connect/')) {
            const branch = valid?.replace('https://dev.suite.sldev.cz/connect/', '');

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

    // not supported, transports are controlled by suite
    public setTransports() {
        throw new Error('Method_InvalidPackage');
    }

    // this shouldn't be needed, ui response should be handled in suite
    uiResponse(_response: UiResponseEvent) {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }
}
