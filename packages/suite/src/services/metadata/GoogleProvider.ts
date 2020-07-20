import { AbstractMetadataProvider } from '@suite-types/metadata';
import GoogleClient from '@suite/services/google';

class GoogleProvider implements AbstractMetadataProvider {
    connected = false;
    client: GoogleClient;

    constructor(token?: string) {
        this.client = new GoogleClient(token);
    }

    async connect() {
        try {
            await this.client.authorize();
            console.warn('connected');
            this.connected = true;
            return true;
        } catch (error) {
            console.warn('connect error', error);
            return false;
        }
    }

    async disconnect() {
        return true;
    }

    async getFileContent(file: string) {
        console.warn('getFileContent', file);

        const id = await this.client.getIdByName(`${file}.mtdt`);
        console.warn('id', id);
        if (!id) return;

        const response = await this.client.get(
            {
                query: {
                    alt: 'media',
                },
            },
            id,
        );

        if (!response.success) {
            throw new Error('failed to download encrypted file from google drive');
        }

        return Buffer.from(response.payload, 'hex');
    }

    async setFileContent(file: string, content: Buffer) {
        const id = await this.client.getIdByName(`${file}.mtdt`);

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
        } else {
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
        }
    }

    async getCredentials() {
        if (!this.client.token) return;
        try {
            const response = await this.client.getTokenInfo();
            console.warn('res', response);
            if (!response.success) return;
            return {
                type: 'google',
                token: this.client.token,
                // @ts-ignore todo:?
                user: response.payload.user.displayName,
            } as const;
        } catch (error) {
            console.warn('getCredentials error', error);
        }
    }

    isLoading() {
        return false;
    }

    isConnected() {
        return this.connected;
    }
}

export default GoogleProvider;
