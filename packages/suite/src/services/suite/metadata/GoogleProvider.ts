import { RateLimiter } from '@suite-common/suite-utils';

import {
    AbstractMetadataProvider,
    MetadataFileInfo,
    OAuthServerEnvironment,
    Tokens,
} from 'src/types/suite/metadata';
import GoogleClient from 'src/services/google';

class GoogleProvider extends AbstractMetadataProvider {
    connected = false;
    isCloud = true;
    constructor(tokens: Tokens, environment: OAuthServerEnvironment) {
        super('google');
        GoogleClient.init(tokens, environment);
    }

    async connect() {
        try {
            await GoogleClient.authorize();
            this.connected = true;
            return this.ok();
        } catch (err) {
            if (err instanceof Error) {
                return this.error('AUTH_ERROR', err.message);
            }
            return this.error(
                'OTHER_ERROR',
                'Unexpected error when trying to connect to google provider',
            );
        }
    }

    async disconnect() {
        try {
            await GoogleClient.revoke();
            return this.ok();
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    async getFileContent(fileName: string) {
        try {
            const id = await GoogleClient.getIdByName(`${fileName}.mtdt`);
            if (!id) {
                return this.ok(undefined);
            }

            const response = await GoogleClient.get(
                {
                    query: {
                        alt: 'media',
                    },
                },
                id,
            );
            if (response) {
                return this.ok(Buffer.from(response, 'hex'));
            }
            return this.ok(undefined);
        } catch (err) {
            // special case, not found means file is not there which is actually information we want to know
            if (err?.error?.code === 404) {
                return this.ok(undefined);
            }
            return this.handleProviderError(err);
        }
    }

    // Google API complains when we try to write too many files at once
    async batchSetFileContent(files: Array<MetadataFileInfo>) {
        const limiter = new RateLimiter(300);

        try {
            const uploadPromises = files.map(async ({ fileName, content }) => {
                const result = await limiter.limit(() => this.setFileContent(fileName, content));

                if (!result.success) {
                    throw new Error(result.error);
                }
            });

            await Promise.all(uploadPromises);

            return this.ok();
        } catch (error) {
            return this.error('PROVIDER_ERROR', error);
        }
    }

    async setFileContent(fileName: string, content: Buffer) {
        try {
            // search for file by name with forceReload=true parameter to make sure that we do not save
            // two files with the same name but different ids
            const id = await GoogleClient.getIdByName(`${fileName}.mtdt`, true);
            if (id) {
                await GoogleClient.update(
                    {
                        body: {
                            name: `${fileName}.mtdt`,
                            mimeType: 'text/plain;charset=UTF-8',
                        },
                    },
                    content.toString('hex'),
                    id,
                );
                return this.ok();
            }
            await GoogleClient.create(
                {
                    body: {
                        name: `${fileName}.mtdt`,
                        mimeType: 'text/plain;charset=UTF-8',
                        parents: ['appDataFolder'],
                    },
                },
                content.toString('hex'),
            );
            return this.ok();
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async getProviderDetails() {
        try {
            const response = await GoogleClient.getTokenInfo();
            return this.ok({
                type: this.type,
                isCloud: this.isCloud,
                tokens: {
                    // saving the access token for users using the implicit OAuth flow
                    // returning to Suite shortly after authorization or refreshing the page
                    accessToken: GoogleClient.accessToken,
                    refreshToken: GoogleClient.refreshToken,
                },
                user: response.user.displayName,
            } as const);
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async isConnected() {
        try {
            const result = await GoogleClient.getAccessToken();
            return !!result;
        } catch (_err) {
            return false;
        }
    }

    /**
     * Specific implementation in every provider. Returns standardized error
     */
    handleProviderError(err: any) {
        // collect human readable errors from wherever possible or fill with own general message;
        let message = err?.error?.message || err?.message;

        if (typeof message !== 'string') {
            // this should never happen
            message = 'unknown error';
        }

        if (err?.error?.code >= 500) {
            return this.error('PROVIDER_ERROR', message);
        }

        if (message.includes('Failed to fetch')) {
            return this.error('CONNECTIVITY_ERROR', 'Internet connection problem');
        }
        // todo: more fine grained errors for google drive
        // https://developers.google.com/drive/api/v3/handle-errors
        switch (err?.error?.code) {
            case 401:
                return this.error('AUTH_ERROR', message);
            case 404:
                return this.error('NOT_FOUND_ERROR', message);
            case 429:
                return this.error('RATE_LIMIT_ERROR', message);
            default:
            // no default
        }
        return this.error('OTHER_ERROR', message);
    }
}

export default GoogleProvider;
