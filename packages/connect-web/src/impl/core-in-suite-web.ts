import {
    CORE_CALL,
    type CallMethodAnyResponse,
    type CallMethodPayload,
    POPUP,
    createErrorMessage,
} from '@trezor/connect/src/events';
import type { ConnectImpl, ConnectImplSettings } from '@trezor/connect/src/impl/dynamic';
import { type Log, initLog } from '@trezor/connect/src/utils/debug';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';

import { getEnv } from '../connectSettings';
import { getSuiteWebUrl } from './getSuiteWebUrl';
import { type Popup } from '../popup/abstract';
import { WebPopup } from '../popup/web';
import { WebExtensionPopup } from '../popup/webextension';

/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
export class CoreInSuiteWeb implements ConnectImpl {
    private _popupManager?: Popup;

    protected logger: Log;

    public constructor() {
        this.logger = initLog('@trezor/connect-web');
    }

    public dispose() {
        return Promise.resolve(undefined);
    }

    public cancel(error?: string) {
        this.logger.debug('cancel', error);

        // Flush any pending outgoing messages so that the cancel is not
        // delayed behind queued sends (relevant for the webextension
        // channel whose sendChain serialises chrome.tabs.update calls).
        this._popupManager?.channel?.clearPendingSends();
        this._popupManager?.channel?.postMessage(
            {
                type: POPUP.CLOSED,
                payload: error ? { error } : {},
            },
            { usePromise: false },
        );
    }

    public init({ env, manifest, version, debug, allowUI }: ConnectImplSettings): Promise<void> {
        this.logger.enabled = !!debug;

        if (!this._popupManager) {
            const resolvedEnv = env ?? getEnv();
            const params = {
                manifest,
                version,
                popupSrc: this.getSuiteUrl(),
                logger: this.logger,
                allowUI,
            };

            switch (resolvedEnv) {
                case 'webextension':
                    this._popupManager = new WebExtensionPopup(params);
                    break;
                case 'web':
                    this._popupManager = new WebPopup(params);
                    break;
                default:
                    // 'node', 'electron', 'react-native' are not supported in connect-web, but we want to log it if it happens
                    this.logger.error('Unsupported environment for connect-web:', resolvedEnv);
                    break;
            }
        }

        this.logger.debug('initiated');

        return Promise.resolve();
    }

    private getSuiteUrl() {
        if (typeof __SUITE_WEB_URL__ !== 'undefined' && __SUITE_WEB_URL__) {
            return `${__SUITE_WEB_URL__}/connect-popup`;
        }

        if (typeof window !== 'undefined') {
            return getSuiteWebUrl(window.location.href, window.location.origin);
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
        try {
            this.logger.debug('call - awaiting popupManger.focusOrCreate()');

            await this._popupManager.focusOrCreate();
            this.logger.debug('call - popupManager.request() resolved');

            await this._popupManager.channel.init();
            this.logger.debug('call - popupManager.channel.init() resolved');
            await this._popupManager.handshakePromise?.promise;

            this.logger.debug('call - sending iframe.call');

            // post message to core in popup
            const response = await this._popupManager.channel.postMessage({
                type: CORE_CALL,
                payload: params,
            });
            this.logger.debug('call: response: ', response);

            if (!response?.payload) {
                throw ERRORS.TypedError('Method_NoResponse');
            }
            if (response.payload.error && response.payload.error.code) {
                throw response.payload.error;
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
