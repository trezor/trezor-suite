import { AbstractMetadataProvider } from '@suite-types/metadata';
import Google from '../google';

class GoogleProvider implements AbstractMetadataProvider {
    client: Google;
    constructor(_token?: string) {
        console.warn('native-GoogleProvider');
        this.client = new Google();
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

export default GoogleProvider;
