import type { Dropbox, DropboxAuth, users } from 'dropbox';

import { AbstractMetadataProvider } from '@suite-common/metadata-types';
import { bufferUtils, getWeakRandomId } from '@trezor/utils';

import {
    type OauthDesktopApiDep,
    extractCredentialsFromAuthorizationFlow,
    getOauthReceiverUrl,
} from '../oauth';

// Dropbox messed up types, that's why @ts-expect-error occurs in this file

type DropboxSDK = {
    auth: DropboxAuth;
    client: Dropbox;
};

// Naming the exports keeps the rest of the SDK (file uploader, downloader) tree-shaken out of the chunk.
const importDropboxSDK = () => import(/* webpackExports: ['Dropbox', 'DropboxAuth'] */ 'dropbox');

/**
 * Starts downloading the Dropbox SDK before the user picks Dropbox:
 * on web, the OAuth popup is blocked unless it opens shortly after the click.
 */
export const preloadDropboxSDK = () => {
    // A failed preload is not reported: the first real use loads the SDK again and reports that.
    importDropboxSDK().catch(() => undefined);
};

export class DropboxProvider extends AbstractMetadataProvider {
    user?: users.FullAccount;
    isCloud = true;
    clientId: string;

    private readonly deps: OauthDesktopApiDep;
    private readonly storedRefreshToken?: string;
    private sdkPromise?: Promise<DropboxSDK>;

    constructor({
        token,
        clientId,
        desktopApi,
    }: OauthDesktopApiDep & { token?: string; clientId: string }) {
        super('dropbox');

        this.deps = { desktopApi };
        this.clientId = clientId;
        this.storedRefreshToken = token;
    }

    /**
     * Loads the Dropbox SDK on first use, so it stays out of the initial bundle.
     * Every call shares one auth and client; a failed load rejects, and the next call retries it.
     */
    getSDK() {
        this.sdkPromise ??= this.loadSDK().catch((error: unknown) => {
            this.sdkPromise = undefined;
            throw error;
        });

        return this.sdkPromise;
    }

    private async loadSDK(): Promise<DropboxSDK> {
        const { Dropbox, DropboxAuth } = await importDropboxSDK();
        const auth = new DropboxAuth({ clientId: this.clientId, fetch: window.fetch.bind(window) });

        if (this.storedRefreshToken) {
            auth.setRefreshToken(this.storedRefreshToken);
        }

        return { auth, client: new Dropbox({ auth }) };
    }

    /**
     * Reports a failed SDK load as a connectivity error,
     * so every provider method keeps resolving with a Result instead of rejecting.
     */
    private async getSDKResult() {
        try {
            return this.ok(await this.getSDK());
        } catch {
            return this.error('CONNECTIVITY_ERROR', 'Failed to load Dropbox SDK');
        }
    }

    async isConnected() {
        // The SDK failed to load -> not connected; connect() then reports the failure.
        const sdk = await this.getSDKResult();
        if (!sdk.success) return false;

        const { auth } = sdk.payload;

        // no token -> means not connected
        if (!auth.getAccessToken()) {
            return false;
        }
        // refresh token is present, refresh it and return true
        try {
            await auth.refreshAccessToken(['']);

            return true;
        } catch {
            return false;
        }
    }

    async connect() {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { auth } = sdk.payload;
        const redirectUrl = await getOauthReceiverUrl(this.deps);

        if (!redirectUrl) return this.error('AUTH_ERROR', 'Failed to get oauth receiver url');

        const url = await auth.getAuthenticationUrl(
            redirectUrl,
            getWeakRandomId(10),
            'code',
            'offline',
            undefined, // If this parameter is omitted, the authorization page will request all scopes selected on the Permissions tab
            'none',
            // PKCE challenge is generated under the hood by dropbox lib, we just pass true (don't ask me why)
            true,
        );

        try {
            // dropbox supports authorization code flow for both web and desktop
            const { code } = await extractCredentialsFromAuthorizationFlow(
                this.deps,
                new URL(url.toString()),
            );
            if (!code)
                return this.error('AUTH_ERROR', 'Failed to extract code from authorization flow');

            const { result } = await auth.getAccessTokenFromCode(redirectUrl, code);

            // @ts-expect-error dropbox lib types result as Object, but access_token & refresh_token are available there as strings
            const { access_token: accessToken, refresh_token: refreshToken } = result;

            auth.setAccessToken(accessToken);
            auth.setRefreshToken(refreshToken);
        } catch (err) {
            if (err instanceof Error) {
                return this.error('AUTH_ERROR', err.message);
            }

            return this.error(
                'OTHER_ERROR',
                'Unexpected error when trying to connect to dropbox provider',
            );
        }

        return this.ok();
    }

    async disconnect() {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { client } = sdk.payload;

        try {
            await client.authTokenRevoke();

            return this.ok();
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    private async _getFileContent(client: Dropbox, file: string) {
        try {
            const { result } = await client.filesSearchV2({
                query: file,
            });

            // this is basically impossible to happen (maybe QA team might get there) after few years of testing
            if (result.has_more) {
                console.error('Dropbox account that has more then 10000 files in Trezor folder');
            }
            if (result?.matches?.length > 0) {
                // check whether the file is in the regular folder ...
                let match = result.matches.find(
                    m => 'metadata' in m.metadata && m.metadata.metadata.path_lower === `/${file}`,
                );

                // ... or in the legacy folder
                // tldr: in the initial releases, files were saved into wrong location
                // see more here: https://github.com/trezor/trezor-suite/pull/2642
                const matchLegacy = result.matches.find(
                    m =>
                        'metadata' in m.metadata &&
                        m.metadata.metadata.path_lower === `/apps/trezor/${file}`,
                );

                // fail if it is in neither
                if (!match && !matchLegacy) return this.ok(undefined);

                // regular file not found, but found one in the legacy folder
                if (!match) match = matchLegacy;

                if (match && 'metadata' in match.metadata) {
                    const { result } = await client.filesDownload({
                        path: match.metadata.metadata.path_lower!,
                    });

                    // @ts-expect-error fileBlob is missing in dropbox lib types file, but it is available
                    const ab = await result.fileBlob.arrayBuffer();

                    return this.ok(Buffer.from(ab));
                }
            }

            // not found. this is not error. user just has not created the file yet
            return this.ok(undefined);
        } catch (err) {
            // example:
            return this.handleProviderError(err);
        }
    }

    async getFileContent(file: string) {
        // Loaded outside the request queue, so a slow or failed load never holds up other requests.
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { client } = sdk.payload;

        return this.scheduleApiRequest(() => this._getFileContent(client, file));
    }

    private async _setFileContent(client: Dropbox, file: string, content: Buffer) {
        try {
            const blobableContent = bufferUtils.toNonSharedBuffer(content);
            const blob = new Blob([blobableContent], {
                type: 'text/plain;charset=UTF-8',
            });
            await client.filesUpload({
                path: `/${file}`,
                contents: blob,
                // @ts-expect-error
                mode: 'overwrite',
            });

            return this.ok();
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async setFileContent(file: string, content: Buffer) {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { client } = sdk.payload;

        return this.scheduleApiRequest(() => this._setFileContent(client, file, content));
    }

    async getFilesList() {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { client } = sdk.payload;

        try {
            const response = await client.filesListFolder({ path: '' });

            if (response.result) {
                const formattedList = response.result.entries.map(({ name }) => name);

                return this.ok(formattedList);
            }

            return this.ok(undefined);
        } catch (error) {
            if (error?.error?.code === 404) {
                return this.ok(undefined);
            }

            return this.handleProviderError(error);
        }
    }

    async renameFile(from: string, to: string) {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { client } = sdk.payload;

        try {
            await client.filesMoveV2({
                from_path: `/${from}`,
                to_path: `/${to}`,
            });

            return this.ok(undefined);
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    async getProviderDetails() {
        const sdk = await this.getSDKResult();
        if (!sdk.success) return sdk;

        const { auth, client } = sdk.payload;
        const token = auth.getRefreshToken();
        if (!token) return this.error('AUTH_ERROR', 'token is missing');

        try {
            const { result } = await client.usersGetCurrentAccount();
            const account = {
                type: this.type,
                isCloud: this.isCloud,
                tokens: {
                    refreshToken: token,
                },
                user: result.name.given_name,
                clientId: this.clientId,
            } as const;

            return this.ok(account);
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    /**
     * Specific implementation in every provider. Returns standardized error
     */
    handleProviderError(err: any) {
        // collect human-readable errors from wherever possible or fill with own general message;
        let message: string =
            err?.error?.user_message ||
            err?.error?.error_description ||
            err?.error?.error_summary ||
            err?.error ||
            err?.message; // if standard error

        if (typeof message !== 'string') {
            // this should never happen
            message = 'unknown error';
        }

        if (message.includes('Failed to fetch')) {
            return this.error('CONNECTIVITY_ERROR', 'Internet connection problem');
        }

        // https://www.dropbox.com/developers/documentation/http/documentation#error-handling
        if (err?.status) {
            if (err.status >= 500) {
                return this.error('PROVIDER_ERROR', message);
            }
            switch (err.status) {
                case 400:
                    return this.error('BAD_INPUT_ERROR', message);
                case 401:
                    return this.error('AUTH_ERROR', message);
                case 403:
                    return this.error('ACCESS_ERROR', message);
                case 409: // endpoint specific error
                    return this.error('RATE_LIMIT_ERROR', message);
                case 429: {
                    const retryAfter =
                        err.headers?.get?.('retry-after') ??
                        err.headers?.['retry-after'] ??
                        err.headers?.['Retry-After'];
                    const retryAfterSeconds = Number(retryAfter);
                    const retryAfterMs =
                        Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
                            ? retryAfterSeconds * 1000
                            : undefined;

                    return this.error('RATE_LIMIT_ERROR', message, retryAfterMs);
                }
                default:
                // intentional fall-through
            }
        }

        return this.error('OTHER_ERROR', message);
    }
}
