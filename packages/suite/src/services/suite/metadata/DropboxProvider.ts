import { Dropbox, DropboxAuth, users } from 'dropbox';
import { AbstractMetadataProvider } from '@suite-types/metadata';
import { extractCredentialsFromAuthorizationFlow, getOauthReceiverUrl } from '@suite-utils/oauth';
import { METADATA } from '@suite-actions/constants';
import { getRandomId } from '@suite-utils/random';

class DropboxProvider extends AbstractMetadataProvider {
    client: Dropbox & { auth: DropboxAuth };
    user: users.FullAccount | undefined;
    isCloud = true;

    constructor(token?: string) {
        super('dropbox');

        const fetch = window.fetch.bind(window);
        this.client = new Dropbox({
            clientId: METADATA.DROPBOX_CLIENT_ID,
            fetch,
        });

        this.client.auth = new DropboxAuth({
            refreshToken: token,
            clientId: METADATA.DROPBOX_CLIENT_ID,
        });

        // if (token) {
        //     // token loaded from storage
        //     this.client.auth.setRefreshToken(token);
        // }
    }

    async isConnected() {
        // no token -> means not connected
        if (!this.client.auth.getAccessToken()) {
            return false;
        }
        // refresh token is present, refresh it and return true
        try {
            const response = await this.client.auth.refreshAccessToken();
            console.log('refreshAccessToken response', response);
            return true;
        } catch (err) {
            return false;
        }
    }

    // todo: maybe return true if success and string if error
    async connect() {
        const redirectUrl = await getOauthReceiverUrl();

        console.log('redirectUrl', redirectUrl);

        if (!redirectUrl) return false;

        const url = this.client.auth.getAuthenticationUrl(
            redirectUrl,
            getRandomId(10),
            'code',
            'offline',
            undefined, // If this parameter is omitted, the authorization page will request all scopes selected on the Permissions tab
            'none',
            // PKCE challenge is generated under the hood by dropbox lib, we just pass true (don't ask me why)
            true,
        );

        console.log('url', url);

        try {
            // dropbox supports authorization code flow for both web and desktop
            const { code } = await extractCredentialsFromAuthorizationFlow(url);

            console.log('code', code);

            if (!code) return false;

            // this.client.auth is instance of DropboxAuth
            const response = await this.client.auth.getAccessTokenFromCode(redirectUrl, code);
            const { result, status, headers } = response;
            console.log(result, status, headers);
            // dropbox lib is broken, on simulated error, it returns status 400 result undefined and throws unhandled rejection inside the lib itself.
            // but this should probably never happen so why not let it go as OTHER_ERROR("unknown error")
            if (status !== 200) {
                return false;
                // return this.handleProviderError(result);
            }
            this.client.auth.setAccessToken(result.access_token);
            this.client.auth.setRefreshToken(result.refresh_token);
        } catch (err) {
            console.log(err);
            // probably never happens
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
            // @ts-ignore again, wrong type in dropbox lib.
            const { result } = await this.client.filesSearch({
                path: '',
                query: `${file}.mtdt`,
            });
            if (!result?.matches?.length) {
                return this.ok(undefined);
            }

            // check whether the file is in the regular folder ...
            let match = result.matches.find(m => m.metadata.path_lower === `/${file}.mtdt`);

            // ... or in the legacy folder
            // tldr: in the initial releases, files were saved into wrong location
            // see more here: https://github.com/trezor/trezor-suite/pull/2642
            const matchLegacy = result.matches.find(
                m => m.metadata.path_lower === `/apps/trezor/${file}.mtdt`,
            );

            // fail if it is in neither
            if (!match && !matchLegacy) return this.ok(undefined);

            // regular file not found, but found one in the legacy folder
            if (!match) match = matchLegacy;

            const response = await this.client.filesDownload({
                path: match.metadata.path_lower!,
            });
            const buffer = (await response.result.fileBlob.arrayBuffer()) as Buffer;

            return this.ok(buffer);
        } catch (err) {
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
        const token = this.client.auth.getRefreshToken();
        if (!token) return this.error('AUTH_ERROR', 'token is missing');

        try {
            // jeeez, this seems to be broken in dropbox lib, type error somewhere low there
            const response = await this.client.usersGetCurrentAccount();
            // @ts-ignore ...
            const { result, status } = response;

            const details = {
                type: this.type,
                isCloud: this.isCloud,
                token,
                user: result.name.given_name,
            } as const;

            return this.ok(details);
        } catch (err) {
            console.log('err', err);
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
