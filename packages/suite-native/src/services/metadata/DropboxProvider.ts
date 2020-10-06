import { AbstractMetadataProvider, Result } from '@suite-types/metadata';

class DropboxProvider extends AbstractMetadataProvider {
    constructor(_token?: string) {
        super('dropbox');
    }

    async connect() {
        return true;
    }

    async disconnect() {
        return true;
    }

    // @ts-ignore
    async getCredentials(): any {
        const type = 'dropbox' as const;
        return this.ok({
            type,
            token: 'token',
            user: 'foo',
        });
    }

    // @ts-ignore
    async getFileContent(_file: string): Result<ArrayBuffer> {
        return this.ok(new ArrayBuffer(0));
    }

    // @ts-ignore
    async setFileContent(_file: string, _content: Buffer): any {
        return this.ok();
    }

    async isConnected() {
        return true;
    }

    handleProviderError() {
        return this.error('OTHER_ERROR', 'FOOO BAR');
    }
}

export default DropboxProvider;
