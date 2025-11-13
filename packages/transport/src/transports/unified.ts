import { v1 as v1Protocol } from '@trezor/protocol';

import {
    AbstractTransport,
    AbstractTransportMethodParams,
    AbstractTransportParams,
} from './abstract';
import { AbstractApi, OpenDeviceChannel } from '../api/abstract';
import { ApiType, DescriptorApiLevel, PathInternal } from '../types';
import { TRANSPORT } from '../constants';
import * as ERRORS from '../errors';
import { SessionsClient } from '../sessions/client';
import { callThpMessage, parseThpMessage, receiveThpMessage, sendThpMessage } from '../thp';
import { Session } from '../types';
import { receiveAndParse } from '../utils/receive';
import { buildMessage, createChunks, sendChunks } from '../utils/send';

/**
 * Check if running in browser environment
 */
const isBrowser = () => typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

export interface UnifiedTransportParams extends AbstractTransportParams {
    apis: AbstractApi | AbstractApi[];
    sessionsClient: SessionsClient;
    sessionsBackgroundUrl?: string | null;
}

/**
 * Unified transport class that supports multiple APIs with automatic
 * proxy-to-local fallback and browser sessions background support.
 */
export class UnifiedTransport extends AbstractTransport {
    public name = 'UnifiedTransport' as const;

    // sessions client is a standardized interface for communicating with sessions backend
    // which can live in couple of context (shared worker, local module, websocket server etc)
    protected sessionsClient: SessionsClient;
    private readonly sessionsBackgroundUrl?: string | null;

    // Registry of APIs: proxy APIs (WebSocket) and local APIs (USB, UDP)
    protected apis: Map<ApiType, { proxy?: AbstractApi; local?: AbstractApi }>;

    // Track which API is currently active per type
    private activeApis: Map<ApiType, 'proxy' | 'local'> = new Map();

    // Upgrade check timer
    private upgradeCheckTimeout?: ReturnType<typeof setTimeout>;
    private readonly UPGRADE_CHECK_INTERVAL = 1000; // Check every second

    constructor({ apis, sessionsClient, sessionsBackgroundUrl, ...rest }: UnifiedTransportParams) {
        super(rest);
        this.apis = new Map();
        this.sessionsClient = sessionsClient;
        this.sessionsBackgroundUrl = sessionsBackgroundUrl ?? undefined;

        // Register APIs
        const apiArray = Array.isArray(apis) ? apis : [apis];
        for (const api of apiArray) {
            this.registerApi(api);
        }
    }

    /**
     * Register an API in the registry
     * Proxy APIs (from WebSocket) are prioritized over local APIs
     */
    private registerApi(api: AbstractApi) {
        const apiType = api.type;
        const existing = this.apis.get(apiType) || {};

        // Determine if this is a proxy API (WebSocket-based)
        const isProxy =
            api.constructor.name.includes('Proxy') || api.constructor.name.includes('WebSocket');

        if (isProxy) {
            existing.proxy = api;
        } else {
            existing.local = api;
        }

        this.apis.set(apiType, existing);
    }

    /**
     * Get the appropriate API for a given type
     * Returns proxy if connected, otherwise local
     */
    protected getApi(apiType: ApiType): AbstractApi | undefined {
        const apis = this.apis.get(apiType);
        if (!apis) return undefined;

        // Try proxy first, but only if it's connected
        let api: AbstractApi | undefined;
        let source: 'proxy' | 'local';

        if (apis.proxy) {
            // Check if proxy is connected (WebSocket APIs have isConnected method)
            const isProxyConnected =
                'isConnected' in apis.proxy &&
                typeof apis.proxy.isConnected === 'function' &&
                apis.proxy.isConnected();

            if (isProxyConnected) {
                api = apis.proxy;
                source = 'proxy';
            } else {
                this.logger?.debug(`[${apiType}] Proxy API not connected, falling back to local`);
                api = apis.local;
                source = 'local';
            }
        } else {
            api = apis.local;
            source = 'local';
        }

        // Track active API and trigger upgrade check if using local
        if (api) {
            const previousSource = this.activeApis.get(apiType);
            this.activeApis.set(apiType, source);

            // If we switched from proxy to local, it's a downgrade - schedule upgrade checks
            if (previousSource === 'proxy' && source === 'local') {
                this.logger?.warn(`[${apiType}] Downgraded from proxy to local API`);
                this.emit(TRANSPORT.ERROR, ERRORS.API_DISCONNECTED);
                this.scheduleUpgradeCheck();
            }
            // If we switched from local to proxy, it's an upgrade
            else if (previousSource === 'local' && source === 'proxy') {
                this.logger?.log(`[${apiType}] Upgraded from local to proxy API`);
            }

            this.logger?.debug(`[${apiType}] Using ${source} API (${api.constructor.name})`);
        } else {
            this.logger?.debug(`[${apiType}] No API available`);
        }

        return api;
    }

    /**
     * Check if proxy APIs can be upgraded (become available)
     */
    private async checkProxyUpgrade(): Promise<boolean> {
        let upgraded = false;

        for (const [apiType, apis] of this.apis.entries()) {
            // Only check if we have both proxy and local, and we're currently using local
            if (!apis.proxy || !apis.local || this.activeApis.get(apiType) !== 'local') {
                continue;
            }

            // Try to connect to the proxy if it has a connect method
            if ('connect' in apis.proxy && typeof (apis.proxy as any).connect === 'function') {
                try {
                    await (apis.proxy as any).connect();
                } catch (err) {
                    // If connection fails, proxy is not available, continue to next API
                    continue;
                }
            }

            // Check if proxy is now connected
            if (
                'isConnected' in apis.proxy &&
                typeof (apis.proxy as any).isConnected === 'function' &&
                (apis.proxy as any).isConnected()
            ) {
                this.logger?.log(`[${apiType}] Proxy API is now available, upgrading...`);

                // First, clear descriptors from local API
                this.sessionsClient.enumerateDone({
                    descriptors: [],
                });

                // Stop listening to local API
                apis.local.removeAllListeners('transport-interface-change');
                // Note: We don't call stop() on the API itself as it might affect other operations

                // Update active API
                this.activeApis.set(apiType, 'proxy');

                // Start listening to proxy API
                apis.proxy.listen();

                // Set up change listener for proxy
                apis.proxy.on('transport-interface-change', descriptors => {
                    this.logger?.debug(
                        `new descriptors from ${apiType} proxy api after upgrade`,
                        descriptors,
                    );
                    this.sessionsClient.enumerateDone({
                        descriptors,
                    });
                });

                // Set up error handler for proxy (to detect if it goes down again)
                apis.proxy.on('transport-interface-error', ({ error }) => {
                    this.logger?.warn(`[${apiType}] Proxy API error after upgrade: ${error}`);

                    // Only handle if proxy is still active
                    if (this.activeApis.get(apiType) === 'proxy') {
                        this.logger?.warn(
                            `[${apiType}] Proxy API disconnected, will downgrade to local`,
                        );

                        // Clear descriptors from proxy
                        this.sessionsClient.enumerateDone({
                            descriptors: [],
                        });

                        // Check if we still have both APIs available
                        if (!apis.proxy || !apis.local) {
                            this.logger?.error(`[${apiType}] Cannot downgrade: APIs not available`);
                            return;
                        }

                        // Switch back to local
                        this.activeApis.set(apiType, 'local');

                        // Remove proxy listeners
                        apis.proxy.removeAllListeners('transport-interface-change');
                        apis.proxy.removeAllListeners('transport-interface-error');

                        // Start listening to local API again
                        apis.local.listen();

                        apis.local.on('transport-interface-change', descriptors => {
                            this.logger?.debug(
                                `new descriptors from ${apiType} local api after downgrade from upgrade`,
                                descriptors,
                            );
                            this.sessionsClient.enumerateDone({
                                descriptors,
                            });
                        });

                        // Trigger immediate enumeration on local
                        apis.local.enumerate().then(result => {
                            if (result.success) {
                                this.sessionsClient.enumerateDone({
                                    descriptors: result.payload,
                                });
                            }
                        });

                        // Schedule upgrade check again
                        this.scheduleUpgradeCheck();
                    }
                });

                // Trigger re-enumeration to pick up devices from proxy
                const enumerateResult = await apis.proxy.enumerate();
                if (enumerateResult.success) {
                    this.sessionsClient.enumerateDone({
                        descriptors: enumerateResult.payload,
                    });
                    upgraded = true;
                }
            }
        }

        return upgraded;
    }

    /**
     * Schedule periodic checks to see if proxy APIs become available
     */
    private scheduleUpgradeCheck() {
        // Clear any existing timeout
        if (this.upgradeCheckTimeout) {
            clearTimeout(this.upgradeCheckTimeout);
        }

        this.upgradeCheckTimeout = setTimeout(async () => {
            if (this.stopped) {
                return;
            }

            const upgraded = await this.checkProxyUpgrade();

            // If we didn't upgrade, schedule another check
            if (!upgraded) {
                this.scheduleUpgradeCheck();
            }
            // If we did upgrade, the upgrade check will be rescheduled if proxy goes down again
        }, this.UPGRADE_CHECK_INTERVAL);
    }

    /**
     * Get all registered API types
     */
    protected getApiTypes(): ApiType[] {
        return Array.from(this.apis.keys());
    }

    get apiType() {
        // Return the first available API type (for backward compatibility)
        const types = this.getApiTypes();
        return types[0] || 'usb';
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async () => {
                // Set up sessions background for WebUSB in browser
                if (isBrowser() && this.sessionsBackgroundUrl) {
                    try {
                        const response = await fetch(this.sessionsBackgroundUrl, {
                            method: 'HEAD',
                        });
                        if (response.ok) {
                            const { BrowserSessionsBackground } = await import(
                                '../sessions/background-browser'
                            );
                            this.sessionsClient.setBackground(
                                new BrowserSessionsBackground(this.sessionsBackgroundUrl),
                            );
                        }
                    } catch (e) {
                        this.logger?.warn('Failed to set up browser sessions background', e);
                    }
                }

                const handshakeRes = await this.sessionsClient.handshake();
                this.stopped = !handshakeRes.success;

                return handshakeRes;
            },
            { signal },
        );
    }

    public listen() {
        if (this.listening) {
            return this.error({ error: ERRORS.ALREADY_LISTENING });
        }

        // Listen to all registered APIs
        for (const [apiType, apis] of this.apis.entries()) {
            // Determine which API should be active
            let activeApi: AbstractApi | undefined;
            let activeSource: 'proxy' | 'local' | undefined;

            if (apis.proxy) {
                const isProxyConnected =
                    'isConnected' in apis.proxy &&
                    typeof apis.proxy.isConnected === 'function' &&
                    apis.proxy.isConnected();

                if (isProxyConnected) {
                    activeApi = apis.proxy;
                    activeSource = 'proxy';
                    this.activeApis.set(apiType, 'proxy');
                } else if (apis.local) {
                    activeApi = apis.local;
                    activeSource = 'local';
                    this.activeApis.set(apiType, 'local');
                    this.scheduleUpgradeCheck();
                }
            } else if (apis.local) {
                activeApi = apis.local;
                activeSource = 'local';
                this.activeApis.set(apiType, 'local');
            }

            // Listen to the active API
            if (activeApi) {
                this.logger?.debug(
                    `[${apiType}] Starting to listen on ${activeSource} API (${activeApi.constructor.name})`,
                );
                activeApi.listen();

                // 1. transport api reports descriptors change
                activeApi.on('transport-interface-change', descriptors => {
                    this.logger?.debug(
                        `new descriptors from ${apiType} api (${activeApi.constructor.name})`,
                        descriptors,
                    );
                    // 2. we signal this to sessions background
                    this.sessionsClient.enumerateDone({
                        descriptors,
                    });
                });
            }

            // Set up error handler for proxy API if it exists (to detect disconnection)
            if (apis.proxy) {
                apis.proxy.on('transport-interface-error', ({ error }) => {
                    this.logger?.warn(`Proxy API error: ${apiType}`, error);

                    // Only handle if proxy was active
                    if (this.activeApis.get(apiType) === 'proxy') {
                        this.logger?.warn(
                            `[${apiType}] Proxy API disconnected, will downgrade to local`,
                        );

                        // Clear descriptors from this proxy API
                        this.sessionsClient.enumerateDone({
                            descriptors: [],
                        });

                        // If we have local API, switch to it
                        if (apis.local) {
                            this.activeApis.set(apiType, 'local');

                            // Start listening to local API
                            this.logger?.debug(
                                `[${apiType}] Starting to listen on local API after proxy disconnect`,
                            );
                            apis.local.listen();

                            apis.local.on('transport-interface-change', descriptors => {
                                this.logger?.debug(
                                    `new descriptors from ${apiType} local api after downgrade`,
                                    descriptors,
                                );
                                this.sessionsClient.enumerateDone({
                                    descriptors,
                                });
                            });

                            // Trigger immediate enumeration on local
                            apis.local.enumerate().then(result => {
                                if (result.success) {
                                    this.sessionsClient.enumerateDone({
                                        descriptors: result.payload,
                                    });
                                }
                            });

                            // Start checking for proxy to come back online
                            this.scheduleUpgradeCheck();
                        }

                        // Emit error to inform upper layers
                        this.emit(TRANSPORT.ERROR, ERRORS.API_DISCONNECTED);
                    }
                });
            }
        }

        this.listening = true;

        // 3. based on 2.sessions background distributes information about descriptors change to all clients
        this.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug('new descriptors from background', descriptors);
            // 4. we propagate new descriptors to higher levels
            this.handleDescriptorsChange(descriptors);
        });

        this.sessionsClient.on('releaseRequest', descriptor => {
            this.deviceEvents.emit(descriptor.path, { type: TRANSPORT.DEVICE_REQUEST_RELEASE });
        });

        return this.success(undefined);
    }

    public enumerate({ signal }: AbstractTransportMethodParams<'enumerate'> = {}) {
        this.logger?.debug('enumerate called on unified transport');
        return this.scheduleAction(
            async signal => {
                // Enumerate all APIs and merge results
                // Rule: if proxy API succeeds, skip local API for that type
                const allDescriptors: DescriptorApiLevel[] = [];

                this.logger?.debug(
                    `Enumerating ${this.apis.size} API type(s): ${Array.from(this.apis.keys()).join(', ')}`,
                );

                for (const [apiType, apis] of this.apis.entries()) {
                    let proxySucceeded = false;

                    // Try proxy first
                    if (apis.proxy) {
                        this.logger?.debug(
                            `[${apiType}] Trying proxy API (${apis.proxy.constructor.name})...`,
                        );
                        const proxyResult = await apis.proxy.enumerate(signal);
                        if (proxyResult.success) {
                            this.logger?.debug(
                                `[${apiType}] Proxy API succeeded, found ${proxyResult.payload.length} device(s)`,
                            );
                            allDescriptors.push(...proxyResult.payload);
                            proxySucceeded = true;
                        } else {
                            this.logger?.debug(
                                `[${apiType}] Proxy API failed: ${proxyResult.error}, will try local`,
                            );
                        }
                    } else {
                        this.logger?.debug(`[${apiType}] No proxy API available`);
                    }

                    // Try local only if proxy didn't succeed
                    if (!proxySucceeded && apis.local) {
                        this.logger?.debug(
                            `[${apiType}] Trying local API (${apis.local.constructor.name})...`,
                        );
                        const localResult = await apis.local.enumerate(signal);
                        if (localResult.success) {
                            this.logger?.debug(
                                `[${apiType}] Local API succeeded, found ${localResult.payload.length} device(s)`,
                            );
                            allDescriptors.push(...localResult.payload);
                        } else {
                            this.logger?.debug(
                                `[${apiType}] Local API failed: ${localResult.error}`,
                            );
                        }
                    } else if (!proxySucceeded) {
                        this.logger?.debug(`[${apiType}] No local API available`);
                    }
                }

                this.logger?.debug(`Total descriptors collected: ${allDescriptors.length}`);

                // inform sessions background about occupied paths and get descriptors back
                const enumerateDoneResponse = await this.sessionsClient.enumerateDone({
                    descriptors: allDescriptors,
                });

                return this.success(enumerateDoneResponse.payload.descriptors);
            },
            { signal },
        );
    }

    public acquire({
        input,
        signal,
        apiType,
    }: AbstractTransportMethodParams<'acquire'> & { apiType?: ApiType }) {
        return this.scheduleAction(
            async signal => {
                const { path } = input;

                const acquireIntentResponse = await this.sessionsClient.acquireIntent(input);

                if (!acquireIntentResponse.success) {
                    return this.error({ error: acquireIntentResponse.error });
                }

                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (!api) {
                    return this.error({
                        error: ERRORS.UNEXPECTED_ERROR,
                        message: `No API available for type: ${targetApiType}`,
                    });
                }

                const reset = !!input.previous;
                const openDeviceResult = await api.openDevice(
                    acquireIntentResponse.payload.path as PathInternal,
                    {
                        reset,
                        signal,
                        channel: 'read',
                    },
                );

                if (!openDeviceResult.success) {
                    return openDeviceResult;
                }

                this.sessionsClient.acquireDone({ path, sessionOwner: this.id });

                return this.success(acquireIntentResponse.payload.session);
            },
            { signal },
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    public subscribe({
        path,
        channels,
        signal,
        apiType,
    }: {
        path: any;
        channels: OpenDeviceChannel[];
        signal?: AbortSignal;
        apiType?: ApiType;
    }) {
        return this.scheduleAction(
            async signal => {
                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (!api) {
                    return this.error({
                        error: ERRORS.UNEXPECTED_ERROR,
                        message: `No API available for type: ${targetApiType}`,
                    });
                }

                const entries = await Promise.all(
                    channels.map(async channel => {
                        try {
                            const res = await api.openDevice(path, {
                                reset: false,
                                signal,
                                channel,
                            });

                            return [channel, res.success];
                        } catch {
                            return [channel, false];
                        }
                    }),
                );

                const map = Object.fromEntries(entries);

                return this.success(map as Record<OpenDeviceChannel, boolean>);
            },
            { signal },
        );
    }

    public release({
        path: _,
        session,
        signal,
        apiType,
    }: AbstractTransportMethodParams<'release'> & { apiType?: ApiType }) {
        return this.scheduleAction(
            async () => {
                const releaseIntentResponse = await this.sessionsClient.releaseIntent({
                    session,
                });

                if (!releaseIntentResponse.success) {
                    return this.error({ error: releaseIntentResponse.error });
                }

                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (api) {
                    await api.closeDevice(releaseIntentResponse.payload.path as PathInternal, {
                        channel: 'read',
                    });
                }

                await this.sessionsClient.releaseDone({
                    path: releaseIntentResponse.payload.path,
                });

                return this.success(null);
            },
            { signal },
        );
    }

    public releaseSync(session: Session, apiType?: ApiType) {
        // Obviously not sync as was advertised. Also looks a bit weird but should be the same as before.
        this.sessionsClient.releaseIntent({ session }).then(res => {
            if (res.success) {
                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (api) {
                    api.closeDevice(res.payload.path as PathInternal, { channel: 'read' });
                }
            }
        });
    }

    public call({
        session,
        name,
        data,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
        apiType,
    }: AbstractTransportMethodParams<'call'> & { apiType?: ApiType }) {
        return this.scheduleAction(
            async signal => {
                const handleError = (error: string) => {
                    // if user revokes usb permissions in browser we need a way how propagate that the device was technically disconnected,
                    if (error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                };
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    // session not found means that device was disconnected
                    if (getPathBySessionResponse.error === 'session not found') {
                        return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
                    }

                    return this.error({ error: ERRORS.UNEXPECTED_ERROR });
                }
                const { path } = getPathBySessionResponse.payload;

                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (!api) {
                    return this.error({
                        error: ERRORS.UNEXPECTED_ERROR,
                        message: `No API available for type: ${targetApiType}`,
                    });
                }

                const protocol = customProtocol || v1Protocol;
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    protocol,
                    thpState,
                });
                const [, chunkHeader] = protocol.getHeaders(bytes);
                const chunks = createChunks(bytes, chunkHeader, api.chunkSize);
                let progress = 0;
                const apiWrite = (chunk: Buffer, attemptSignal?: AbortSignal) => {
                    if (chunks.length > 1) {
                        progress++;
                        this.emit(TRANSPORT.SEND_MESSAGE_PROGRESS, progress / chunks.length);
                    }

                    return api.write(path as PathInternal, chunk, attemptSignal || signal);
                };

                const apiRead = (attemptSignal?: AbortSignal) =>
                    api.read(path as PathInternal, attemptSignal || signal);

                if (protocol.name === 'v2') {
                    const prevNonce = thpState?.sendNonce;
                    const callResult = await callThpMessage({
                        thpState,
                        chunks,
                        apiWrite,
                        apiRead,
                        signal,
                        graceful: true,
                        logger: this.logger,
                    });
                    if (!callResult.success) {
                        handleError(callResult.error);

                        return callResult;
                    }

                    // sync bit and nonce updated by Cancel
                    if (prevNonce === thpState?.sendNonce) {
                        thpState?.sync('send', name);
                    }
                    const message = parseThpMessage({
                        messages: this.messages,
                        decoded: callResult.payload,
                        thpState,
                    });
                    thpState?.sync('recv', message.type);

                    return this.success(message);
                }
                const sendResult = await sendChunks(chunks, apiWrite);

                if (!sendResult.success) {
                    handleError(sendResult.error);

                    return sendResult;
                }

                const readResult = await receiveAndParse(this.messages, apiRead, protocol);

                if (!readResult.success) {
                    handleError(readResult.error);

                    return readResult;
                }

                return readResult;
            },
            { signal, graceful: true, timeout },
        );
    }

    public send({
        data,
        session,
        name,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
        apiType,
    }: AbstractTransportMethodParams<'send'> & { apiType?: ApiType }) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error });
                }
                const { path } = getPathBySessionResponse.payload;

                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (!api) {
                    return this.error({
                        error: ERRORS.UNEXPECTED_ERROR,
                        message: `No API available for type: ${targetApiType}`,
                    });
                }

                const protocol = customProtocol || v1Protocol;
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    protocol,
                    thpState,
                });
                const [_, chunkHeader] = protocol.getHeaders(bytes);

                const chunks = createChunks(bytes, chunkHeader, api.chunkSize);
                let progress = 0;
                const apiWrite = (chunk: Buffer) => {
                    if (chunks.length > 1) {
                        progress++;
                        this.emit(TRANSPORT.SEND_MESSAGE_PROGRESS, progress / chunks.length);
                    }

                    return api.write(path as PathInternal, chunk, signal);
                };
                let sendResult;
                if (protocol.name === 'v2') {
                    sendResult = await sendThpMessage({
                        thpState,
                        skipAck: true,
                        chunks,
                        apiWrite,
                        apiRead: attemptSignal =>
                            api.read(path as PathInternal, attemptSignal || signal),
                        signal,
                        graceful: true,
                        logger: this.logger,
                    });
                    thpState?.sync('send', name);
                } else {
                    sendResult = await sendChunks(chunks, apiWrite);
                }

                if (!sendResult.success) {
                    if (sendResult.error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }

                    return sendResult;
                }

                return { success: true, payload: undefined } as const;
            },
            { signal, graceful: true, timeout },
        );
    }

    public receive({
        session,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
        apiType,
    }: AbstractTransportMethodParams<'receive'> & { apiType?: ApiType }) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error });
                }
                const { path } = getPathBySessionResponse.payload;

                // Use provided apiType or fallback to first available
                const targetApiType = apiType || this.getApiTypes()[0];
                const api = this.getApi(targetApiType);
                if (!api) {
                    return this.error({
                        error: ERRORS.UNEXPECTED_ERROR,
                        message: `No API available for type: ${targetApiType}`,
                    });
                }

                const apiRead = (attemptSignal?: AbortSignal) =>
                    api.read(path as PathInternal, attemptSignal || signal);

                const protocol = customProtocol || v1Protocol;
                if (protocol.name === 'v2') {
                    const decoded = await receiveThpMessage({
                        thpState,
                        skipAck: true,
                        apiWrite: (chunk, attemptSignal) =>
                            api.write(path as PathInternal, chunk, attemptSignal || signal),
                        apiRead,
                        signal,
                        graceful: true,
                        logger: this.logger,
                    });

                    if (!decoded.success) {
                        return decoded;
                    }

                    const message = parseThpMessage({
                        messages: this.messages,
                        decoded: decoded.payload,
                        thpState,
                    });

                    return this.success(message);
                }

                const message = await receiveAndParse(this.messages, apiRead, protocol);

                if (!message.success) {
                    if (message.error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                }

                return message;
            },
            { signal, graceful: true, timeout },
        );
    }

    releaseDevice(session: Session, apiType?: ApiType) {
        return this.sessionsClient
            .getPathBySession({
                session,
            })
            .then(response => {
                if (response.success) {
                    // Use provided apiType or fallback to first available
                    const targetApiType = apiType || this.getApiTypes()[0];
                    const api = this.getApi(targetApiType);
                    if (api) {
                        return api.closeDevice(response.payload.path as PathInternal, {
                            channel: 'read',
                        });
                    }
                }

                return this.success(undefined);
            });
    }

    stop() {
        // Clear upgrade check timeout
        if (this.upgradeCheckTimeout) {
            clearTimeout(this.upgradeCheckTimeout);
            this.upgradeCheckTimeout = undefined;
        }

        if (!this.stopped) {
            // Listen for transport changes on first available API
            const firstType = this.getApiTypes()[0];
            const firstApi = this.getApi(firstType);
            if (firstApi) {
                firstApi.once('transport-interface-change', () => {
                    this.logger?.debug('device connected after transport stopped, goodbye...');
                });
            }
        }

        super.stop();
        // note:
        // not disposing sessionClient on purpose. on window reload, transport.stop is called. we do not want to clear sessions background data in this case because
        // there might be another client connected to it. When the last client disconnects, the background disposes itself.

        // Dispose all registered APIs
        for (const [, apis] of this.apis.entries()) {
            apis.proxy?.dispose();
            apis.local?.dispose();
        }
    }
}
