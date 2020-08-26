import { AbstractMetadataProvider } from '@suite-types/metadata';

class DropboxProvider implements AbstractMetadataProvider {
    type: 'dropbox';

    constructor(_token?: string) {
        console.warn('native-DropboxProvider');
        this.type = 'dropbox';
    }

    async connect() {
        return true;
    }

    async disconnect() {
        return true;
    }

    async getCredentials() {}

    async getFileContent() {}
    async setFileContent() {}

    isConnected() {
        return true;
    }
}

export default DropboxProvider;
