import { AbstractMetadataProvider } from '@suite-types/metadata';

class UserDataProvider implements AbstractMetadataProvider {
    type: 'userData';
    
    constructor() {
        console.warn('UserDataProvider');
        this.type = 'userData';
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
