import { Dropbox } from 'dropbox';
import { AbstractMetadataProvider } from '@suite-types/metadata';
import { getOauthCode, getOauthReceiverUrl } from '@suite-utils/oauth';
import { METADATA } from '@suite-actions/constants';
import { getRandomId } from '@suite-utils/random';

class DropboxProvider extends AbstractMetadataProvider {
    client: Dropbox;
    user: DropboxTypes.users.FullAccount | undefined;

    constructor(token?: string) {
        super('dropbox');

        const fetch = window.fetch.bind(window);
        this.client = new Dropbox({ clientId: METADATA.DROPBOX_CLIENT_ID, fetch });

        if (token) {
            // token loaded from storage
            this.client.setRefreshToken(token);
        }
    }

    async isConnected() {
        // no token -> means not connected
        if (!this.client.getAccessToken()) {
            return false;
        }
        // refresh token is present, refresh it and return true
        try {
            await this.client.refreshAccessToken(['']);
            return true;
        } catch (err) {
            return false;
        }
    }

    // todo: maybe return true if success and string if error
    async connect() {
        const redirectUrl = await getOauthReceiverUrl();

        if (!redirectUrl) return false;

        const url = this.client.getAuthenticationUrl(
            redirectUrl,
            getRandomId(10),
            'code',
            'offline',
            undefined, // If this parameter is omitted, the authorization page will request all scopes selected on the Permissions tab
            'none',
            // PKCE challenge is generated under the hood by dropbox lib, we just pass true (don't ask me why)
            true,
        );

        try {
            const code = await getOauthCode(url);

            if (!code) return false;

            // @ts-ignore todo: types are broken in the lib, latest version 6.0.1 is broken as well at time of writing this
            const { accessToken, refreshToken } = await this.client.getAccessTokenFromCode(
                redirectUrl,
                code,
            );
            this.client.setAccessToken(accessToken);
            this.client.setRefreshToken(refreshToken);
        } catch (err) {
            // todo:
            return false;
        }

        return true;
    }

    async disconnect() {
        try {
            await this.client.authTokenRevoke();
            return true;
        } catch (error) {
            // todo: silent error, maybe ok here?
            return false;
        }
    }

    async getFileContent(file: string) {
        try {
            const exists = await this.client.filesSearch({
                path: '',
                query: `${file}.mtdt`,
            });
            if (exists?.matches?.length > 0) {
                // sanity check
                const match = exists.matches.find(
                    m => m.metadata.path_lower === `/apps/trezor/${file}.mtdt`,
                );
                if (!match) return this.ok(undefined);

                const download = await this.client.filesDownload({
                    path: match.metadata.path_lower!,
                });

                // @ts-ignore: fileBlob not defined?
                const buffer = (await download.fileBlob.arrayBuffer()) as Buffer;

                return this.ok(buffer);
            }
            return this.ok(undefined);
            // not found. this is not error. user just has not created the file yet
        } catch (err) {
            // example:
            return this.handleProviderError(err);
        }
    }

    async setFileContent(file: string, content: Buffer) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=UTF-8' });
            await this.client.filesUpload({
                path: `/Apps/TREZOR/${file}.mtdt`,
                contents: blob,
                // @ts-ignore
                mode: 'overwrite',
            });

            return this.ok();
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async getCredentials() {
        const token = this.client.getRefreshToken();
        if (!token) return this.error('AUTH_ERROR', 'token is missing');

        try {
            const account = await this.client.usersGetCurrentAccount();

            const result = {
                type: 'dropbox',
                token,
                user: account.name.given_name,
            } as const;

            return this.ok(result);
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
