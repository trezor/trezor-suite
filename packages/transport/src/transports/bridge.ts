import {
    PROTOCOL_MALFORMED,
    type ThpState,
    type TransportProtocol,
    bridge as protocolBridge,
    v1 as protocolV1,
} from '@trezor/protocol';
import { versionUtils } from '@trezor/utils';

import {
    AbstractTransport,
    type AbstractTransportMethodParams,
    type AbstractTransportParams,
} from './abstract';
import { TRANSPORT } from '../constants';
import * as ERRORS from '../errors';
import { ping } from '../pinger/ping';
import { parseThpMessage } from '../thp/receive';
import type {
    AnyError,
    AsyncResultWithTypedError,
    BridgeCommonErrors,
    BridgeProtocolMessage,
    Descriptor,
    Session,
} from '../types';
import { bridgeApiCall } from '../utils/bridgeApiCall';
import * as bridgeApiResult from '../utils/bridgeApiResult';
import { createProtocolMessage } from '../utils/bridgeProtocolMessage';
import { receiveAndParse } from '../utils/receive';
import { error, success } from '../utils/result';
import { buildMessage } from '../utils/send';

const DEFAULT_URL = 'http://127.0.0.1';
const DEFAULT_PORT = 21325;

type BridgeEndpoint =
    | '/'
    | '/listen'
    | '/acquire'
    | '/post'
    | '/abort'
    | '/call'
    | '/enumerate'
    | '/release'
    | '/read';

type R = Extract<
    ReturnType<
        | (typeof bridgeApiResult)['acquire']
        | (typeof bridgeApiResult)['call']
        | (typeof bridgeApiResult)['empty']
        | (typeof bridgeApiResult)['devices']
        | (typeof bridgeApiResult)['info']
    >,
    { success: true }
>['payload'];

type IncompleteRequestOptions = {
    params?: string;
    body?: any;
    timeout?: number;
    signal?: AbortController['signal'];
};

type BridgeConstructorParameters = AbstractTransportParams & { port?: number };

export class BridgeTransport extends AbstractTransport {
    private useProtocolMessages: boolean = false;
    private useAbortEndpoint: boolean = false;
    /**
     * url of trezord server.
     */
    private url: string;

    public name = 'BridgeTransport' as const;

    constructor(params: BridgeConstructorParameters) {
        const { port = DEFAULT_PORT, ...rest } = params || {};
        super(rest);
        this.url = `${DEFAULT_URL}:${port}`;
    }

    ping(_: AbstractTransportMethodParams<'ping'> = {}) {
        return ping(`${this.url}/`).catch(() => false);
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async signal => {
                const response = await this.post('/', {
                    signal,
                });

                if (!response.success) {
                    return response;
                }

                this.version = response.payload.version;

                if (!this.version.startsWith('3')) {
                    this.isOutdated = true;
                }
                this.useProtocolMessages = !!response.payload.protocolMessages;
                this.useAbortEndpoint = versionUtils.isNewerOrEqual(this.version, '3.2.1');

                this.stopped = false;

                return success(undefined);
            },
            { signal },
        );
    }

    // https://github.com/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L373
    public listen() {
        if (this.listening) {
            return error({ code: ERRORS.ALREADY_LISTENING });
        }

        this.listening = true;
        this.listenLoop();

        return success(undefined);
    }

    private async listenLoop() {
        while (!this.stopped) {
            const response = await this.post('/listen', {
                body: this.descriptors,
                signal: this.abortController.signal,
            });

            if (!response.success) {
                this.emit(TRANSPORT.ERROR, response.error.code);
            } else {
                this.handleDescriptorsChange(response.payload);
            }
        }
    }

    // https://github.com/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L235
    public enumerate({ signal }: AbstractTransportMethodParams<'enumerate'> = {}) {
        return this.scheduleAction(signal => this.post('/enumerate', { signal }), { signal });
    }

    // https://github.com/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L420
    public acquire({ input, signal }: AbstractTransportMethodParams<'acquire'>) {
        return this.scheduleAction(
            async signal => {
                const response = await this.post('/acquire', {
                    params: `${input.path}/${input.previous ?? 'null'}`,
                    signal,
                    body: {
                        sessionOwner: this.id,
                    },
                });

                return response;
            },
            { signal },
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    // https://github.com/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L354
    public release({ path: _, session, signal }: AbstractTransportMethodParams<'release'>) {
        return this.scheduleAction(
            async signal => {
                const response = await this.post('/release', {
                    params: session,
                    signal,
                });

                return response.success ? success(null) : response;
            },
            { signal },
        );
    }

    public releaseSync(session: Session) {
        if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
            navigator.sendBeacon(`${this.url}/release/${session}?beacon=1`);
        } else {
            this.post('/release', { params: session });
        }
    }

    public releaseDevice() {
        return Promise.resolve(success(undefined));
    }

    private getProtocol(customProtocol?: TransportProtocol) {
        if (!this.useProtocolMessages) {
            // custom protocols not supported by legacy bridge
            return protocolBridge;
        }

        return customProtocol || protocolV1;
    }

    private getRequestBody(body: Buffer, protocol: TransportProtocol, thpState?: ThpState) {
        return createProtocolMessage(
            body,
            this.useProtocolMessages ? protocol : undefined,
            thpState?.serialize(),
        );
    }

    // in some setups abort signal is resolved on the client-side but never resolves on the server-size (like android OkHttp request)
    // abort signal is also meant to resolve immediately but it could take a while to process it on the server
    // try to abort pending process through the server and fallback to local signal only if that fails
    private createAbortSignal = (session: Session, signal?: AbortSignal) => {
        if (!this.useAbortEndpoint) {
            return signal;
        }

        const abortController = new AbortController();
        signal?.addEventListener('abort', async () => {
            const result = await this.post('/abort', { params: session });
            if (!result.success) {
                this.logger?.warn(`/abort/${session} error: ${result.error}`);
                abortController.abort();
            }
        });

        return abortController.signal;
    };

    // https://github.com/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L534
    public call({
        session,
        name,
        data,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
    }: AbstractTransportMethodParams<'call'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    protocol,
                    thpState,
                });

                const prevNonce = thpState?.sendNonce;
                const response = await this.post(`/call`, {
                    params: session,
                    body: this.getRequestBody(bytes, protocol, thpState),
                    signal: this.createAbortSignal(session, signal),
                });

                if (!response.success) {
                    return response;
                }

                const respBytes = Buffer.from(response.payload.data, 'hex');
                if (protocol.name === 'v2') {
                    // see callThpMessage in @trezor/transport-bridge
                    // sync bit and nonce updated by Cancel
                    if (prevNonce === thpState?.sendNonce) {
                        thpState?.sync('send', name);
                    }
                    const message = parseThpMessage({
                        decoded: protocol.decode(respBytes),
                        messages: this.messages,
                        thpState,
                    });
                    thpState?.sync('recv', message.type);

                    if (response.payload.thpState) {
                        thpState?.setRecentMessage(
                            Buffer.from(response.payload.thpState.recentMessage || '', 'hex'),
                        );
                    }

                    return success(message);
                }

                return receiveAndParse(
                    this.messages,
                    () => Promise.resolve(success(respBytes)),
                    protocol,
                );
            },
            { signal, timeout },
        );
    }

    public send({
        session,
        name,
        data,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
    }: AbstractTransportMethodParams<'send'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    protocol,
                    thpState,
                });
                // see sendThpMessage in @trezor/transport-bridge
                const response = await this.post('/post', {
                    params: session,
                    body: this.getRequestBody(bytes, protocol, thpState),
                    signal: this.createAbortSignal(session, signal),
                });
                if (!response.success) {
                    return response;
                }
                if (thpState) {
                    if (thpState.isPiggybackAckEnabled) {
                        thpState.enablePiggybackAck(false);
                    }
                    thpState.sync('send', name);
                }

                return success(undefined);
            },
            { signal, timeout },
        );
    }

    public receive({
        session,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
    }: AbstractTransportMethodParams<'receive'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const response = await this.post('/read', {
                    params: session,
                    body: this.getRequestBody(Buffer.alloc(0), protocol, thpState),
                    signal: this.createAbortSignal(session, signal),
                });

                if (!response.success) {
                    return response;
                }

                const respBytes = Buffer.from(response.payload.data, 'hex');
                if (protocol.name === 'v2') {
                    // see readThpMessage in @trezor/transport-bridge
                    const message = parseThpMessage({
                        decoded: protocol.decode(respBytes),
                        messages: this.messages,
                        thpState,
                    });
                    thpState?.sync('recv', message.type);

                    return success(message);
                }

                return receiveAndParse(
                    this.messages,
                    () => Promise.resolve(success(respBytes)),
                    protocol,
                );
            },
            { signal, timeout },
        );
    }

    /**
     * All bridge endpoints use POST methods
     * For documentation, look here: https://github.com/trezor/trezord-go#api-documentation
     */
    private async post(
        endpoint: '/',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        Exclude<ReturnType<typeof bridgeApiResult.info>, { success: false }>['payload'],
        BridgeCommonErrors
    >;
    private async post(
        endpoint: '/acquire',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        Session,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.SESSION_WRONG_PREVIOUS
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
    >;
    private async post(
        endpoint: '/call' | '/post' | '/read',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        BridgeProtocolMessage,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
    >;
    private async post(
        endpoint: '/release',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<undefined, BridgeCommonErrors | typeof ERRORS.SESSION_NOT_FOUND>;
    private async post(
        endpoint: '/abort',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<undefined, BridgeCommonErrors | typeof ERRORS.SESSION_NOT_FOUND>;
    private async post(
        endpoint: '/listen',
        options?: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<Descriptor[], BridgeCommonErrors>;
    private async post(
        endpoint: '/enumerate',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<Descriptor[], BridgeCommonErrors>;
    private async post(
        endpoint: BridgeEndpoint,
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<R, AnyError> {
        const response = await bridgeApiCall({
            ...options,
            method: 'POST',
            url: `${this.url + endpoint}${options?.params ? `/${options.params}` : ''}`,
            skipContentTypeHeader: true,
        });

        if (!response.success) {
            if (response.error.code === ERRORS.UNEXPECTED_ERROR) {
                return this.unknownError(response.error.code);
            }
            if (response.error.code === ERRORS.HTTP_ERROR) {
                return error({ code: response.error.code });
            }

            switch (endpoint) {
                case '/':
                    return this.unknownError(response.error.code);
                case '/acquire':
                    return this.unknownError(response.error.code, [
                        ERRORS.SESSION_WRONG_PREVIOUS,
                        ERRORS.DEVICE_NOT_FOUND,
                        ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.LIBUSB_ERROR_ACCESS,
                    ]);
                case '/call':
                case '/read':
                case '/post':
                    return this.unknownError(response.error.code, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.OTHER_CALL_IN_PROGRESS,
                        ERRORS.INTERFACE_DATA_TRANSFER,
                        PROTOCOL_MALFORMED,
                    ]);
                case '/abort':
                    return this.unknownError(response.error.code, [ERRORS.SESSION_NOT_FOUND]);
                case '/enumerate':
                case '/listen':
                    return this.unknownError(response.error.code);
                case '/release':
                    return this.unknownError(response.error.code, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                    ]);
                default:
                    return error({
                        code: ERRORS.WRONG_RESULT_TYPE,
                        message: 'just for type safety, should never happen',
                    });
                // should never get here
            }
        }

        switch (endpoint) {
            case '/':
                return bridgeApiResult.info(response.payload);
            case '/acquire':
                return bridgeApiResult.acquire(response.payload);
            case '/read':
            case '/call':
                return bridgeApiResult.call(response.payload);
            case '/post':
                return bridgeApiResult.post(response.payload);
            case '/enumerate':
            case '/listen':
                return bridgeApiResult.devices(response.payload);
            case '/release':
                return bridgeApiResult.empty(response.payload);
            case '/abort':
                return bridgeApiResult.empty(response.payload);
            default:
                return error({
                    code: ERRORS.WRONG_RESULT_TYPE,
                    message: 'just for type safety, should never happen',
                });
            // should never get here
        }
    }
}
