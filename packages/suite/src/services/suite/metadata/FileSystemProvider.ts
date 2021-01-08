import { AbstractMetadataProvider } from '@suite-types/metadata';

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
            token: '',
            user: '',
        });
    }

    async getFileContent(file: string) {
        const result = await window.desktopApi!.metadataRead({ file: `${file}.mtdt` });
        if (!result.success) {
            return this.error('PROVIDER_ERROR', result.error);
        }
        if (!result.payload) {
            return this.ok(undefined);
        }
        return this.ok(Buffer.from(result.payload, 'hex'));
    }

    async setFileContent(file: string, content: Buffer) {
        const hex = content.toString('hex');

        const result = await window.desktopApi!.metadataWrite({
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
