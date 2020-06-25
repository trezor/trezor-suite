import { AbstractMetadataProvider } from '@suite-types/metadata';

class UserDataProvider implements AbstractMetadataProvider {
    constructor() {
        console.warn('ELO!');
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

export default UserDataProvider;
