import type { DesktopApi } from '@trezor/suite-desktop-api';

import { AbstractMetadataProvider } from './AbstractProvider';

export class FileSystemProvider extends AbstractMetadataProvider {
    isCloud = false;
    desktopApi: DesktopApi;

    constructor({ desktopApi }: { desktopApi: DesktopApi }) {
        super('fileSystem');
        this.desktopApi = desktopApi;
    }

    get clientId() {
        return this.type;
    }

    connect() {
        return Promise.resolve(this.ok());
    }

    disconnect() {
        return Promise.resolve(this.ok());
    }

    // eslint-disable-next-line
    async getProviderDetails() {
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
            tokens: {},
            user: '',
            clientId: this.clientId,
        });
    }

    async getFileContent(file: string) {
        const result = await this.desktopApi.metadataRead({ file });
        if (!result.success && result.code !== 'ENOENT') {
            return this.error('PROVIDER_ERROR', result.error);
        }

        return this.ok(result.success ? Buffer.from(result.payload, 'hex') : undefined);
    }

    async setFileContent(file: string, content: Buffer) {
        const hex = content.toString('hex');

        const result = await this.desktopApi.metadataWrite({
            file,
            content: hex,
        });
        if (!result.success) {
            return this.error('PROVIDER_ERROR', result.error);
        }

        return this.ok(undefined);
    }

    async getFilesList() {
        const response = await this.desktopApi.metadataGetFiles();

        if (!response.success) {
            return this.error('PROVIDER_ERROR', response.error);
        }

        return this.ok(response.payload);
    }

    async renameFile(from: string, to: string) {
        const response = await this.desktopApi.metadataRenameFile({
            file: from,
            to,
        });

        if (!response.success) {
            return this.error('PROVIDER_ERROR', response.error);
        }

        return this.ok(undefined);
    }

    isConnected() {
        return true;
    }
}
