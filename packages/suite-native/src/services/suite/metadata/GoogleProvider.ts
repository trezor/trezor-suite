/* eslint-disable require-await */

import { AbstractMetadataProvider, Result } from '@suite-types/metadata';
import Google from '../../google';

class GoogleProvider extends AbstractMetadataProvider {
    client: Google;
    isCloud = true;

    constructor(_token?: string) {
        super('google');
        console.warn('native-GoogleProvider');
        this.client = new Google();
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

    handleProviderError(_err: any) {
        return this.error('OTHER_ERROR', 'Foo bar');
    }
}

export default GoogleProvider;
