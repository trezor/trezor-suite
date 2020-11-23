/* eslint-disable require-await */
import { AbstractMetadataProvider, Result } from '@suite-types/metadata';

class DropboxProvider extends AbstractMetadataProvider {
    isCloud = true;
    constructor(_token?: string) {
        super('dropbox');
    }

    async connect() {
        try {
            return this.ok();
        } catch (err) {
            if (err instanceof Error) {
                return this.error('AUTH_ERROR', err.message);
            }
            return this.error('OTHER_ERROR', 'failed');
        }
    }

    async disconnect() {
        return this.ok();
    }

    // @ts-ignore
    async getProviderDetails(): any {
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
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
