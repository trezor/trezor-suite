import { desktopApi } from '@trezor/suite-desktop-api';
import { AbstractMetadataProvider, MetadataFileInfo } from 'src/types/suite/metadata';

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

    async getFileContent(fileName: string) {
        const result = await desktopApi.metadataRead({ file: `${fileName}.mtdt` });
        if (!result.success && result.code !== 'ENOENT') {
            return this.error('PROVIDER_ERROR', result.error);
        }
        return this.ok(result.success ? Buffer.from(result.payload, 'hex') : undefined);
    }

    async batchSetFileContent(files: Array<MetadataFileInfo>) {
        const writePromises = files.map(async ({ fileName, content }) => {
            const result = await this.setFileContent(fileName, content);

            if (!result.success) {
                throw new Error(result.error);
            }
        });

        try {
            await Promise.all(writePromises);

            return this.ok(undefined);
        } catch (error) {
            return this.error('PROVIDER_ERROR', error);
        }
    }

    async setFileContent(fileName: string, content: Buffer) {
        const hex = content.toString('hex');

        const result = await desktopApi.metadataWrite({
            file: `${fileName}.mtdt`,
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
