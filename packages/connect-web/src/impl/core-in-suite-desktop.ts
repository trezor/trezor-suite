import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import {
    CORE_CALL,
    type CallMethodAnyResponse,
    type CallMethodPayload,
    POPUP,
} from '@trezor/connect-common/src/events';
import type { ConnectImpl } from '@trezor/connect-common/src/impl/dynamic';
import type { PermissionRequest } from '@trezor/connect-common/src/types/method';
import type { ConnectImplSettings, Manifest } from '@trezor/connect-common/src/types/settings';
import {
    type CancelParams,
    createCoreCallCancelMessage,
} from '@trezor/connect-common/src/utils/cancelParams';
import { WebsocketClient, WebsocketError } from '@trezor/websocket-client';

// Ports the Suite desktop http-receiver may bind its connect-ws endpoint to. Mirrors
// HTTP_RECEIVER_PORTS in packages/suite-desktop-core/src/libs/http-receiver.ts: the
// receiver falls back to the next port when 21335 is taken, so the client probes the
// same range to find it. Kept in sync by hand — connect-web sits below the suite-desktop
// layer and cannot import from it.
const CONNECT_WS_PORTS = [21335, 21336, 21337, 21338, 21339] as const;

const connectWsUrl = (port: number) => `ws://127.0.0.1:${port}/connect-ws`;

/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
export class CoreInSuiteDesktop implements ConnectImpl {
    private manifest?: Manifest;
    private version?: string;
    private requestedPermissions?: PermissionRequest[];
    private ws: WebsocketClient<Record<never, never>>;
    private localNetworkPermissionState: PermissionState | 'unknown' = 'unknown';

    public constructor() {
        this.ws = new WebsocketClient({ url: connectWsUrl(CONNECT_WS_PORTS[0]) });
    }

    public dispose() {
        this.manifest = undefined;
        this.version = undefined;
        this.requestedPermissions = undefined;
        this.ws.dispose();

        return Promise.resolve(undefined);
    }

    public cancel(params?: CancelParams) {
        this.ws.sendMessage(createCoreCallCancelMessage(params));
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
                        settings: {
                            manifest: this.manifest,
                            version: this.version,
                            requestedPermissions: this.requestedPermissions,
                        },
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

    public async init({
        manifest,
        version,
        requestedPermissions,
    }: ConnectImplSettings): Promise<void> {
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
        this.requestedPermissions = requestedPermissions;

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
        if (this.ws.isConnected()) {
            return;
        }

        let lastError: Error | undefined;
        for (const port of CONNECT_WS_PORTS) {
            // Reuse the client the constructor built for the default port; probe the
            // remaining ports with throwaway clients and keep the first one that accepts
            // a connection (the receiver may have fallen back off 21335).
            const candidate =
                this.ws.options.url === connectWsUrl(port)
                    ? this.ws
                    : new WebsocketClient<Record<never, never>>({ url: connectWsUrl(port) });
            try {
                await candidate.connect();
                if (candidate !== this.ws) {
                    this.ws.dispose();
                    this.ws = candidate;
                }

                return;
            } catch (err) {
                if (candidate !== this.ws) {
                    candidate.dispose();
                }
                lastError = err instanceof Error ? err : new WebsocketError(String(err));
            }
        }

        throw this.error(lastError ?? new WebsocketError('websocket_not_initialized'));
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
