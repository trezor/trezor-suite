import { AbstractMetadataProvider } from '@suite-types/metadata';

class DropboxProvider implements AbstractMetadataProvider {
    constructor(_token?: string) {
        console.warn('native-DropboxProvider');
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
    isLoading() {
        return true;
    }
}

export default DropboxProvider;
