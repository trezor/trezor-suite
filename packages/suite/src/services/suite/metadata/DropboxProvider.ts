/* eslint-disable camelcase */
import { Dropbox, DropboxAuth } from 'dropbox';
import type { users } from 'dropbox';
import { AbstractMetadataProvider } from '@suite-types/metadata';
import { extractCredentialsFromAuthorizationFlow, getOauthReceiverUrl } from '@suite-utils/oauth';
import { METADATA } from '@suite-actions/constants';
import { getWeakRandomId } from '@trezor/utils';

// this is incorrectly typed in dropbox

class DropboxProvider extends AbstractMetadataProvider {
    client: Dropbox;
    auth: DropboxAuth;
    user: users.FullAccount | undefined;
    isCloud = true;

    constructor(token?: string) {
        super('dropbox');

        const fetch = window.fetch.bind(window);

        const dbxAuth = new DropboxAuth({ clientId: METADATA.DROPBOX_CLIENT_ID, fetch });

        this.auth = dbxAuth;

        this.client = new Dropbox({
            auth: dbxAuth,
        });

        if (token) {
            // token loaded from storage
            this.auth.setRefreshToken(token);
        }
    }

    async isConnected() {
        // no token -> means not connected
        if (!this.auth.getAccessToken()) {
            return false;
        }
        // refresh token is present, refresh it and return true
        try {
            await this.auth.refreshAccessToken(['']);
            return true;
        } catch (err) {
            return false;
        }
    }

    async connect() {
        const redirectUrl = await getOauthReceiverUrl();

        if (!redirectUrl) return this.error('AUTH_ERROR', 'Failed to get oauth receiver url');

        const url = await this.auth.getAuthenticationUrl(
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
            const { code } = await extractCredentialsFromAuthorizationFlow(url);

            if (!code)
                return this.error('AUTH_ERROR', 'Failed to extract code from authorization flow');

            const { result } = await this.auth.getAccessTokenFromCode(redirectUrl, code);

            const { access_token: accessToken, refresh_token: refreshToken } = result;

            this.auth.setAccessToken(accessToken);
            this.auth.setRefreshToken(refreshToken);
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
        try {
            await this.client.authTokenRevoke();
            return this.ok();
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    async getFileContent(file: string) {
        try {
            const { result } = await this.client.filesSearchV2({
                query: `${file}.mtdt`,
            });

            // this is basically impossible to happen (maybe QA team might get there) after few years of testing
            if (result.has_more) {
                console.error('Dropbox account that has more then 10000 files in Trezor folder');
            }
            if (result?.matches?.length > 0) {
                // check whether the file is in the regular folder ...
                let match = result.matches.find(
                    m =>
                        'metadata' in m.metadata &&
                        m.metadata.metadata.path_lower === `/${file}.mtdt`,
                );

                // ... or in the legacy folder
                // tldr: in the initial releases, files were saved into wrong location
                // see more here: https://github.com/trezor/trezor-suite/pull/2642
                const matchLegacy = result.matches.find(
                    m =>
                        'metadata' in m.metadata &&
                        m.metadata.metadata.path_lower === `/apps/trezor/${file}.mtdt`,
                );

                // fail if it is in neither
                if (!match && !matchLegacy) return this.ok(undefined);

                // regular file not found, but found one in the legacy folder
                if (!match) match = matchLegacy;

                if (match && 'metadata' in match.metadata) {
                    const download = await this.client.filesDownload({
                        path: match!.metadata.metadata.path_lower!,
                    });

                    const ab = await download.result.fileBlob.arrayBuffer();

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

    async setFileContent(file: string, content: Buffer) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=UTF-8' });
            await this.client.filesUpload({
                path: `/${file}.mtdt`,
                contents: blob,
                // @ts-ignore
                mode: 'overwrite',
            });

            return this.ok();
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async getProviderDetails() {
        const token = this.auth.getRefreshToken();
        if (!token) return this.error('AUTH_ERROR', 'token is missing');

        try {
            const { result } = await this.client.usersGetCurrentAccount();
            const account = {
                type: this.type,
                isCloud: this.isCloud,
                token,
                user: result.name.given_name,
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
        // collect human readable errors from wherever possible or fill with own general message;
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
                case 429: // rate limit error
                    return this.error('RATE_LIMIT_ERROR', message);
                default:
                // intentional fall-through
            }
        }
        return this.error('OTHER_ERROR', message);
    }
}

export default DropboxProvider;
