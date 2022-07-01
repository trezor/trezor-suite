import { AbstractMetadataProvider } from '@suite-types/metadata';
import GoogleClient from '@suite/services/google';

class GoogleProvider extends AbstractMetadataProvider {
    connected = false;
    client: GoogleClient;
    isCloud = true;
    constructor(token?: string) {
        super('google');
        this.client = new GoogleClient(token);
    }

    async connect() {
        try {
            await this.client.authorize();
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
            await this.client.revoke();
            return this.ok();
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    async getFileContent(file: string) {
        try {
            const id = await this.client.getIdByName(`${file}.mtdt`);
            if (!id) {
                return this.ok(undefined);
            }

            const response = await this.client.get(
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

    async setFileContent(file: string, content: Buffer) {
        try {
            // search for file by name with forceReload=true parameter to make sure that we do not save
            // two files with the same name but different ids
            const id = await this.client.getIdByName(`${file}.mtdt`, true);
            if (id) {
                await this.client.update(
                    {
                        body: {
                            name: `${file}.mtdt`,
                            mimeType: 'text/plain;charset=UTF-8',
                        },
                    },
                    content.toString('hex'),
                    id,
                );
                return this.ok();
            }
            await this.client.create(
                {
                    body: {
                        name: `${file}.mtdt`,
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
        if (!this.client.token) return this.error('AUTH_ERROR', 'token is missing');
        try {
            const response = await this.client.getTokenInfo();
            return this.ok({
                type: this.type,
                isCloud: this.isCloud,
                token: this.client.token,
                user: response.user.displayName,
            } as const);
        } catch (err) {
            return this.handleProviderError(err);
        }
    }

    async isConnected() {
        try {
            await this.client.oauth2Client.getAccessToken();
            return true;
        } catch (_err) {
            return false;
        }
    }

    /**
     * Specific implementation in every provider. Returns standardized error
     */
    handleProviderError(err: any) {
        // collect human readable errors from wherever possible or fill with own general message;
        let message: string = err?.error?.message || err?.message;

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
