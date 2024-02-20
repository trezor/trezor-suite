import { desktopApi } from '@trezor/suite-desktop-api';
import { AbstractMetadataProvider } from 'src/types/suite/metadata';

class FileSystemProvider extends AbstractMetadataProvider {
    isCloud = false;
    constructor() {
        super('fileSystem');
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
        const result = await desktopApi.metadataRead({ file });
        if (!result.success && result.code !== 'ENOENT') {
            return this.error('PROVIDER_ERROR', result.error);
        }

        return this.ok(result.success ? Buffer.from(result.payload, 'hex') : undefined);
    }

    async setFileContent(file: string, content: Buffer) {
        const hex = content.toString('hex');

        const result = await desktopApi.metadataWrite({
            file,
            content: hex,
        });
        if (!result.success) {
            return this.error('PROVIDER_ERROR', result.error);
        }

        return this.ok(undefined);
    }

    async getFilesList() {
        const response = await desktopApi.metadataGetFiles();

        if (!response.success) {
            return this.error('PROVIDER_ERROR', response.error);
        }

        return this.ok(response.payload);
    }

    async renameFile(from: string, to: string) {
        const response = await desktopApi.metadataRenameFile({
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

export default FileSystemProvider;
