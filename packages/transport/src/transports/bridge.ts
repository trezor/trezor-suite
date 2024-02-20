import { versionUtils, createDeferred, Deferred, createTimeoutPromise } from '@trezor/utils';
import { PROTOCOL_MALFORMED, bridge as bridgeProtocol } from '@trezor/protocol';
import { bridgeApiCall } from '../utils/bridgeApiCall';
import * as bridgeApiResult from '../utils/bridgeApiResult';
import { buildBuffers } from '../utils/send';
import { receiveAndParse } from '../utils/receive';
import {
    AbstractTransport,
    AbstractTransportParams,
    AbstractTransportMethodParams,
} from './abstract';

import * as ERRORS from '../errors';
import { AnyError, AsyncResultWithTypedError, Descriptor } from '../types';

const DEFAULT_URL = 'http://127.0.0.1:21325';

type BridgeEndpoint =
    | '/'
    | '/listen'
    | '/acquire'
    | '/post'
    | '/call'
    | '/enumerate'
    | '/release'
    | '/read';

type BridgeCommonErrors =
    | typeof ERRORS.HTTP_ERROR
    | typeof ERRORS.WRONG_RESULT_TYPE
    | typeof ERRORS.UNEXPECTED_ERROR;

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
    timeout?: boolean;
    signal?: AbortController['signal'];
};

type BridgeConstructorParameters = AbstractTransportParams & {
    // bridge url
    url?: string;
    latestVersion?: string;
};

export class BridgeTransport extends AbstractTransport {
    /**
     * information about  the latest version of trezord.
     */
    private latestVersion?: string;
    /**
     * url of trezord server.
     */
    private url: string;

    /**
     * means that /acquire call is in progress. this is used to postpone /listen call so that it can be
     * fired with updated descriptor
     */
    protected acquirePromise?: Deferred<void>;

    public name = 'BridgeTransport' as const;

    constructor(params?: BridgeConstructorParameters) {
        const { url = DEFAULT_URL, latestVersion, ...args } = params || {};
        super(args);
        this.url = url;
        this.latestVersion = latestVersion;
    }

    public init() {
        return this.scheduleAction(async signal => {
            const response = await this.post('/', {
                signal,
            });

            if (!response.success) {
                return response;
            }

            this.version = response.payload.version;

            if (this.latestVersion) {
                this.isOutdated = versionUtils.isNewer(this.latestVersion, this.version);
            }

            return this.success(undefined);
        });
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L373
    public listen() {
        if (this.listening) {
            return this.error({ error: ERRORS.ALREADY_LISTENING });
        }

        this.listening = true;
        this.listen2();

        return this.success(undefined);
    }

    private async listen2(): Promise<void> {
        if (this.stopped) {
            return;
        }
        const listenTimestamp = new Date().getTime();

        const response = await this.post('/listen', {
            body: this.descriptors,
            signal: this.abortController.signal,
        });

        if (!response.success) {
            const time = new Date().getTime() - listenTimestamp;
            if (time > 1100) {
                await createTimeoutPromise(1000);

                return this.listen2();
            }
            this.emit('transport-error', response.error);

            return;
        }

        if (this.acquirePromise) {
            await this.acquirePromise.promise;
        }

        this.handleDescriptorsChange(response.payload);

        return this.listen2();
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L235
    public enumerate() {
        return this.scheduleAction(signal => this.post('/enumerate', { signal }));
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L420
    public acquire({ input }: AbstractTransportMethodParams<'acquire'>) {
        return this.scheduleAction(
            async signal => {
                const previous = input.previous == null ? 'null' : input.previous;

                if (this.listening) {
                    // listenPromise is resolved on next listen
                    this.listenPromise[input.path] = createDeferred();
                }

                // it is not quaranteed that /listen response will arrive after /acquire response (although in majority of cases it does)
                // so, in order to be able to keep the logic "acquire -> wait for listen response -> return from acquire" we need to wait
                // for /acquire response before resolving listenPromise
                this.acquirePromise = createDeferred();

                const response = await this.post('/acquire', {
                    params: `${input.path}/${previous}`,
                    timeout: true,
                    signal,
                });

                this.acquirePromise.resolve(undefined);

                if (!response.success) {
                    return response;
                }

                this.acquiredUnconfirmed[input.path] = response.payload;

                if (!this.listenPromise[input.path]) {
                    return this.success(response.payload);
                }

                return this.listenPromise[input.path].promise.finally(() => {
                    delete this.listenPromise[input.path];
                });
            },
            undefined,
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L354
    public release({ path, session, onClose }: AbstractTransportMethodParams<'release'>) {
        return this.scheduleAction(signal => {
            if (this.listening && !onClose) {
                this.releasingSession = session;
                this.listenPromise[path] = createDeferred();
            }

            const releasePromise = this.post('/release', {
                params: session,
                signal,
            });

            if (onClose) {
                return Promise.resolve(this.success(undefined));
            }

            if (!this.listenPromise[path]) {
                return releasePromise;
            }

            return this.listenPromise[path].promise
                .then(() => this.success(undefined))
                .finally(() => {
                    delete this.listenPromise[path];
                });
        });
    }

    public releaseDevice() {
        return Promise.resolve(this.success(undefined));
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L534
    public call({ session, name, data, protocol }: AbstractTransportMethodParams<'call'>) {
        return this.scheduleAction(
            async signal => {
                const { encode, decode } = protocol || bridgeProtocol;
                const [bytes] = buildBuffers(this.messages, name, data, encode);
                const response = await this.post(`/call`, {
                    params: session,
                    body: bytes.toString('hex'),
                    signal,
                });
                if (!response.success) {
                    return response;
                }
                const message = await receiveAndParse(
                    this.messages,
                    () => Promise.resolve(Buffer.from(response.payload, 'hex')),
                    decode,
                );

                return this.success(message);
            },
            { timeout: undefined },
        );
    }

    public send({ session, name, data, protocol }: AbstractTransportMethodParams<'send'>) {
        return this.scheduleAction(async signal => {
            const { encode } = protocol || bridgeProtocol;
            const [bytes] = buildBuffers(this.messages, name, data, encode);
            const response = await this.post('/post', {
                params: session,
                body: bytes.toString('hex'),
                signal,
            });
            if (!response.success) {
                return response;
            }

            return this.success(undefined);
        });
    }

    public receive({ session, protocol }: AbstractTransportMethodParams<'receive'>) {
        return this.scheduleAction(async signal => {
            const response = await this.post('/read', {
                params: session,
                signal,
            });

            if (!response.success) {
                return response;
            }
            const { decode } = protocol || bridgeProtocol;
            const message = await receiveAndParse(
                this.messages,
                () => Promise.resolve(Buffer.from(response.payload, 'hex')),
                decode,
            );

            return this.success(message);
        });
    }

    public stop() {
        this.stopped = true;
        this.listening = false;
        this.abortController.abort();
    }

    /**
     * All bridge endpoints use POST methods
     * For documentation, look here: https://github.com/trezor/trezord-go#api-documentation
     */
    private async post(
        endpoint: '/',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<{ version: string; configured: boolean }, BridgeCommonErrors>;
    private async post(
        endpoint: '/acquire',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        string,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.SESSION_WRONG_PREVIOUS
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
    >;
    private async post(
        endpoint: '/call',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        string,
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
        endpoint: '/post',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        string,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
    >;
    private async post(
        endpoint: '/read',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        string,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
    >;
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
        const { timeout, signal, ...restOptions } = options;

        const response = await bridgeApiCall({
            ...restOptions,
            method: 'POST',
            url: `${this.url + endpoint}${options?.params ? `/${options.params}` : ''}`,
            skipContentTypeHeader: true,
        });

        if (!response.success) {
            if (response.error === ERRORS.UNEXPECTED_ERROR) {
                return response;
            }
            if (response.error === ERRORS.HTTP_ERROR) {
                return this.error({ error: response.error });
            }

            switch (endpoint) {
                case '/':
                    return this.unknownError(response.error, []);
                case '/acquire':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_WRONG_PREVIOUS,
                        ERRORS.DEVICE_NOT_FOUND,
                        ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                    ]);
                case '/read':
                case '/call':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.OTHER_CALL_IN_PROGRESS,
                        PROTOCOL_MALFORMED,
                    ]);
                case '/enumerate':
                case '/listen':
                    return this.unknownError(response.error, []);
                case '/post':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.OTHER_CALL_IN_PROGRESS,
                        PROTOCOL_MALFORMED,
                    ]);
                case '/release':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                    ]);
                default:
                    return this.error({
                        error: ERRORS.WRONG_RESULT_TYPE,
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
            case '/enumerate':
            case '/listen':
                return bridgeApiResult.devices(response.payload);
            case '/post':
            case '/release':
                return bridgeApiResult.empty(response.payload);
            default:
                return this.error({
                    error: ERRORS.WRONG_RESULT_TYPE,
                    message: 'just for type safety, should never happen',
                });
            // should never get here
        }
    }
}
