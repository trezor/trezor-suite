import { desktopApi } from '@trezor/suite-desktop-api';
import { AbstractMetadataProvider } from 'src/types/suite/metadata';

class FileSystemProvider extends AbstractMetadataProvider {
    isCloud = false;
    constructor() {
        super('fileSystem');
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
        });
    }

    async getFileContent(file: string) {
        const result = await desktopApi.metadataRead({ file: `${file}.mtdt` });
        if (!result.success && result.code !== 'ENOENT') {
            return this.error('PROVIDER_ERROR', result.error);
        }
        return this.ok(result.success ? Buffer.from(result.payload, 'hex') : undefined);
    }

    async setFileContent(file: string, content: Buffer) {
        const hex = content.toString('hex');

        const result = await desktopApi.metadataWrite({
            file: `${file}.mtdt`,
            content: hex,
        });
        if (!result.success) {
            return this.error('PROVIDER_ERROR', result.error);
        }

        return this.ok(undefined);
    }

    isConnected() {
        return true;
    }
}

export default FileSystemProvider;
