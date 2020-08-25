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

    // @ts-ignore not implemeneted yet
    async getCredentials() {}

    // @ts-ignore not implemeneted yet
    async getFileContent() {}

    // @ts-ignore not implemeneted yet
    async setFileContent() {}

    // @ts-ignore
    isConnected() {
        return true;
    }
}

export default UserDataProvider;
