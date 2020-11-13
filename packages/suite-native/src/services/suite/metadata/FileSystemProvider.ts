/* eslint-disable require-await */

import { AbstractMetadataProvider, Result } from '@suite-types/metadata';

class FileSystemProvider extends AbstractMetadataProvider {
    isCloud = true;

    constructor(_token?: string) {
        super('fileSystem');
    }

    async connect() {
        return true;
    }

    async disconnect() {
        return true;
    }

    // @ts-ignore
    async getProviderDetails(): any {
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
            token: '',
            user: '',
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

    handleProviderError(_err: any) {
        return this.error('OTHER_ERROR', 'Foo bar');
    }
}

export default FileSystemProvider;
