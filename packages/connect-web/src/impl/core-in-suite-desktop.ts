// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.

import {
    CORE_CALL,
    CallMethodAnyResponse,
    CallMethodPayload,
    POPUP,
} from '@trezor/connect/src/events';
import type { ConnectImpl, ConnectImplSettings } from '@trezor/connect/src/impl/dynamic';
import type { Manifest } from '@trezor/connect/src/types/settings';
import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { WebsocketClient, WebsocketError } from '@trezor/websocket-client';

/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
export class CoreInSuiteDesktop implements ConnectImpl {
    private manifest?: Manifest;
    private version?: string;
    private ws: WebsocketClient<{}>;
    private localNetworkPermissionState: PermissionState | 'unknown' = 'unknown';

    public constructor() {
        this.ws = new WebsocketClient({ url: 'ws://127.0.0.1:21335/connect-ws' });
    }

    public dispose() {
        this.manifest = undefined;
        this.version = undefined;
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
                    payload: { settings: { manifest: this.manifest, version: this.version } },
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

    public async init({ manifest, version }: ConnectImplSettings): Promise<void> {
        // navigator should be always present in the runtime
        // but since in tests we run this code in node.js for convenience, we can make this check optional
        if (typeof navigator !== 'undefined' && navigator?.permissions?.query) {
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
        }

        // manifest is required in all implementations. for core-in-suite-desktop, also manifest.appName is required
        if (!manifest.appName) {
            throw ERRORS.TypedError(
                'Init_ManifestMissing',
                'Manifest is missing or manifest.appName is not set',
            );
        }

        this.manifest = manifest;
        this.version = version;

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

            if (response.success === false) {
                return {
                    success: false,
                    error: response.error,
                };
            }

            return {
                success: true,
                payload: response.payload,
                device: response.device,
            };
        } catch (err) {
            return {
                success: false,
                error: ERRORS.serializeError(this.error(err)),
            };
        }
    }
}
