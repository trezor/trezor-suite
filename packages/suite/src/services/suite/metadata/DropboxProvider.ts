import { Dropbox, DropboxAuth } from 'dropbox';
import type { users } from 'dropbox';
import { AbstractMetadataProvider } from 'src/types/suite/metadata';
import {
    extractCredentialsFromAuthorizationFlow,
    getOauthReceiverUrl,
} from 'src/utils/suite/oauth';

import { getWeakRandomId } from '@trezor/utils';

// Dropbox messed up types, that's why @ts-expect-error occurs in this file

class DropboxProvider extends AbstractMetadataProvider {
    client: Dropbox;
    auth: DropboxAuth;
    user?: users.FullAccount;
    isCloud = true;
    clientId: string;

    constructor({ token, clientId }: { token?: string; clientId: string }) {
        super('dropbox');

        const fetch = window.fetch.bind(window);

        const dbxAuth = new DropboxAuth({ clientId, fetch });

        this.clientId = clientId;

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
            // @ts-expect-error dropbox lib types url as String object, but it is primite string
            const { code } = await extractCredentialsFromAuthorizationFlow(url);

            if (!code)
                return this.error('AUTH_ERROR', 'Failed to extract code from authorization flow');

            const { result } = await this.auth.getAccessTokenFromCode(redirectUrl, code);

            // @ts-expect-error dropbox lib types result as Object, but access_token & refresh_token are available there as strings
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

    private async _getFileContent(file: string) {
        try {
            const { result } = await this.client.filesSearchV2({
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
                    const { result } = await this.client.filesDownload({
                        path: match!.metadata.metadata.path_lower!,
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

    getFileContent(file: string) {
        return this.scheduleApiRequest(() => this._getFileContent(file));
    }

    private async _setFileContent(file: string, content: Buffer) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=UTF-8' });
            await this.client.filesUpload({
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

    setFileContent(file: string, content: Buffer) {
        return this.scheduleApiRequest(() => this._setFileContent(file, content));
    }

    async getFilesList() {
        try {
            const response = await this.client.filesListFolder({ path: '' });

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
        try {
            await this.client.filesMoveV2({
                from_path: `/${from}`,
                to_path: `/${to}`,
            });

            return this.ok(undefined);
        } catch (error) {
            return this.handleProviderError(error);
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
