import { AbstractMetadataProvider } from '@suite-types/metadata';
import Google from '../google';

class GoogleProvider implements AbstractMetadataProvider {
    client: Google;
    type: 'google';

    constructor(_token?: string) {
        console.warn('native-GoogleProvider');
        this.client = new Google();
        this.type = 'google';
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

export default GoogleProvider;
