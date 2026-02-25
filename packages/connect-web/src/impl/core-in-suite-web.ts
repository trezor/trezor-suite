import EventEmitter from 'events';

import {
    CORE_CALL,
    CallMethodAnyResponse,
    CallMethodPayload,
    POPUP,
    createErrorMessage,
} from '@trezor/connect/src/events';
import type { ConnectImpl, ConnectImplSettings } from '@trezor/connect/src/impl/dynamic';
import { Log, initLog } from '@trezor/connect/src/utils/debug';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';

import { getEnv } from '../connectSettings';
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

    public init({ env, manifest, version, debug }: ConnectImplSettings): Promise<void> {
        this.logger.enabled = !!debug;

        if (!this._popupManager) {
            this._popupManager = new PopupManager({
                manifest,
                version,
                env: env ?? getEnv(),
                popupSrc: this.getSuiteUrl(),
                logger: this.logger,
            });
        }

        this.logger.debug('initiated');

        return Promise.resolve();
    }

    private getSuiteUrl() {
        // this is for web
        // todo: the only problem I see here is that a 3rd party when developing locally
        // on the http://localhost:8088 will not fallback to the the production version of connect-popup
        if (typeof window !== 'undefined' && window.location.origin === 'http://localhost:8088') {
            return 'http://localhost:8000/connect-popup';
        }
        if (
            typeof window !== 'undefined' &&
            window.location.href.startsWith('https://dev.suite.sldev.cz/connect/')
        ) {
            const branch = window.location.href.match(/\/connect\/(.+?)(?:\/methods\/|$)/)?.[1];
            if (branch) {
                return `https://dev.suite.sldev.cz/suite-web/${branch}/web/connect-popup`;
            }
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
            if (response.error.message && response.error.code) {
                throw response.error;
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
}
