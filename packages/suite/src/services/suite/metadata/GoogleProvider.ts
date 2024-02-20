import { AbstractMetadataProvider, OAuthServerEnvironment, Tokens } from 'src/types/suite/metadata';
import GoogleClient from 'src/services/google';

class GoogleProvider extends AbstractMetadataProvider {
    connected = false;
    isCloud = true;
    constructor(tokens: Tokens, environment: OAuthServerEnvironment) {
        super('google');
        GoogleClient.init(tokens, environment);
    }

    get clientId() {
        return GoogleClient.clientId;
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

    private async _getFileContent(file: string) {
        try {
            const id = await GoogleClient.getIdByName(file);
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

    getFileContent(file: string) {
        return this.scheduleApiRequest(() => this._getFileContent(file));
    }

    private async _setFileContent(file: string, content: Buffer) {
        try {
            // search for file by name with forceReload=true parameter to make sure that we do not save
            // two files with the same name but different ids
            const id = await GoogleClient.getIdByName(file, true);
            if (id) {
                await GoogleClient.update(
                    {
                        body: {
                            name: file,
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
                        name: file,
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

    setFileContent(file: string, content: Buffer) {
        return this.scheduleApiRequest(() => this._setFileContent(file, content));
    }

    async getFilesList() {
        try {
            const response = await GoogleClient.list({
                query: { spaces: 'appDataFolder' },
            });

            if (response) {
                const formattedList = response.files.map(({ name }) => name);

                return this.ok(formattedList);
            }

            return this.ok(undefined);
        } catch (error) {
            return this.handleProviderError(error);
        }
    }

    async renameFile(from: string, to: string) {
        try {
            const id = await GoogleClient.getIdByName(from, true);

            await GoogleClient.updateMetadata(
                {
                    body: {
                        name: to,
                        mimeType: 'text/plain;charset=UTF-8',
                    },
                },
                id,
            );

            return this.ok(undefined);
        } catch (error) {
            return this.handleProviderError(error);
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
                clientId: this.clientId,
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
