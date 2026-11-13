import { connectPublicCallableMethods } from '@trezor/connect-common/src/callableMethods';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { corsValidator, parseManifest } from '@trezor/connect-common/src/data';
import {
    DEEPLINK_VERSION,
    DEFAULT_DOMAIN_MAJOR_VER,
} from '@trezor/connect-common/src/data/version';
import { type CallMethodPayload, createErrorMessage } from '@trezor/connect-common/src/events';
import { factoryPublic } from '@trezor/connect-common/src/factory';
import type { ConnectMobileSettings, Manifest } from '@trezor/connect-common/src/types';
import type {
    TrezorConnectCore,
    TrezorConnectPublicAPI,
} from '@trezor/connect-common/src/types/api';
import {
    type CancelParams,
    normalizeCancelParams,
} from '@trezor/connect-common/src/utils/cancelParams';
import {
    createDeferredManager,
    getWeakRandomUUID,
    isArrayMember,
    removeTrailingSlashes,
} from '@trezor/utils';

type BuildUrlParams = {
    method: string;
    id: string;
    params: any;
    connectSrc: string | undefined;
    callbackUrl: string;
    manifest?: Manifest;
};

type TrezorConnectMobileAPI = TrezorConnectPublicAPI<ConnectMobileSettings> & {
    handleDeeplink: (url: string) => void;
};

type DeeplinkResponse = {
    success: boolean;
    payload?: unknown;
    error?: unknown;
    device?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isDeeplinkResponse = (value: unknown): value is DeeplinkResponse => {
    if (!isRecord(value) || typeof value.success !== 'boolean') return false;
    if (value.device !== undefined && !isRecord(value.device)) return false;

    if (value.success) return 'payload' in value && value.error === undefined;

    return (
        value.payload === undefined &&
        isRecord(value.error) &&
        typeof value.error.message === 'string' &&
        typeof value.error.code === 'string'
    );
};

const buildUrl = ({ method, id, params, connectSrc, callbackUrl, manifest }: BuildUrlParams) => {
    const urlWithParams = new URL(callbackUrl);
    urlWithParams.searchParams.set('id', id);

    return (
        removeTrailingSlashes(connectSrc || DEFAULT_DOMAIN_MAJOR_VER) +
        `/deeplink/${DEEPLINK_VERSION}/` +
        `?method=${method}` +
        `&params=${encodeURIComponent(JSON.stringify(params))}` +
        `&callback=${encodeURIComponent(urlWithParams.toString())}` +
        (manifest?.appName ? `&appName=${encodeURIComponent(manifest.appName)}` : '') +
        (manifest?.appIcon ? `&appIcon=${encodeURIComponent(manifest.appIcon)}` : '')
    );
};

export class TrezorConnectDeeplink implements TrezorConnectCore<ConnectMobileSettings> {
    // Prefer crypto.randomUUID, but fall back to a weak id where `crypto` is absent: connect-mobile
    // is a published deeplink transport for third-party React Native apps that may lack a `crypto`
    // polyfill. These ids are only request/response correlation keys, so the weak fallback is fine.
    private messages = createDeferredManager<DeeplinkResponse & { id: string }, string>({
        generateId: () =>
            typeof globalThis.crypto?.randomUUID === 'function'
                ? globalThis.crypto.randomUUID()
                : getWeakRandomUUID(),
    });

    private manifest?: Manifest;

    private openDeeplink: (method: string, id: string, params: any) => void = () => {
        throw ERRORS.TypedError('Init_NotInitialized');
    };

    public init({
        manifest,
        connectSrc,
        deeplinkOpen,
        deeplinkCallbackUrl,
    }: ConnectMobileSettings) {
        this.manifest = parseManifest(manifest);

        if (!this.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        if (!deeplinkOpen) {
            throw new Error('TrezorConnect native requires "deeplinkOpen" setting.');
        }
        if (!deeplinkCallbackUrl) {
            throw new Error('TrezorConnect native requires "deeplinkCallbackUrl" setting.');
        }
        try {
            new URL(deeplinkCallbackUrl);
        } catch {
            throw new Error('Provided "deeplinkCallbackUrl" is not valid.');
        }

        const validConnectSrc =
            connectSrc === 'trezorsuite://connect' ? connectSrc : corsValidator(connectSrc);

        this.openDeeplink = (method, id, params) => {
            const url = buildUrl({
                method,
                id,
                params,
                connectSrc: validConnectSrc,
                callbackUrl: deeplinkCallbackUrl,
                manifest: this.manifest,
            });

            return deeplinkOpen(url);
        };

        return Promise.resolve();
    }

    public call(params: CallMethodPayload) {
        if (!isArrayMember(params.method, connectPublicCallableMethods)) {
            return Promise.resolve(
                createErrorMessage(
                    ERRORS.TypedError(
                        'Method_InvalidPackage',
                        `'${params.method}' is not part of TrezorConnect public API`,
                    ),
                ),
            );
        }

        const { promise, promiseId } = this.messages.create();
        const { method, ...restParams } = params;

        const onOpenError = (error: unknown) => {
            const response = createErrorMessage(
                error instanceof Error ? error : new Error('Unable to open Trezor Suite'),
            );
            this.messages.resolve(promiseId, { id: promiseId, ...response });
        };

        try {
            void Promise.resolve(this.openDeeplink(method, promiseId, restParams)).catch(
                onOpenError,
            );
        } catch (error) {
            onOpenError(error);
        }

        return promise;
    }

    public cancel(params?: CancelParams) {
        const { reason } = normalizeCancelParams(params);
        this.resolveMessagePromises(createErrorMessage(ERRORS.TypedError('Method_Cancel', reason)));
    }

    public dispose() {
        this.manifest = undefined;
        this.openDeeplink = () => {
            throw ERRORS.TypedError('Init_NotInitialized');
        };
        this.resolveMessagePromises(createErrorMessage(ERRORS.TypedError('Method_Interrupted')));

        return Promise.resolve(undefined);
    }

    public handleDeeplink(url: string): void {
        let id;
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
            id = parsedUrl.searchParams.get('id');
            if (!id || parsedUrl.searchParams.getAll('id').length !== 1) {
                throw new Error('Expected one `id` parameter.');
            }
        } catch {
            this.resolveMessagePromises(
                createErrorMessage(
                    ERRORS.TypedError('Method_InvalidParameter', 'Invalid deeplink callback URL.'),
                ),
            );

            return;
        }

        let parsedResponse: unknown;
        try {
            const responseParam = parsedUrl.searchParams.get('response');
            if (responseParam && parsedUrl.searchParams.getAll('response').length === 1) {
                parsedResponse = JSON.parse(responseParam);
            }
        } catch {
            // Report malformed JSON through the same failure envelope below.
        }

        if (!isDeeplinkResponse(parsedResponse)) {
            this.messages.resolve(id, {
                id,
                ...createErrorMessage(
                    ERRORS.TypedError('Method_InvalidParameter', 'Invalid deeplink response.'),
                ),
            });

            return;
        }

        this.messages.resolve(id, { ...parsedResponse, id });
    }

    private resolveMessagePromises(response: ReturnType<typeof createErrorMessage>) {
        this.messages.resolveAll(id => ({ id, ...response }));
    }
}

const TrezorConnect: TrezorConnectMobileAPI = factoryPublic(new TrezorConnectDeeplink());

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
