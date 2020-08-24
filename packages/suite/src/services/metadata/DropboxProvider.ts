import { Dropbox } from 'dropbox';
import { AbstractMetadataProvider } from '@suite-types/metadata';
import { getMetadataOauthToken, getOauthReceiverUrl } from '@suite-utils/oauth';
import { METADATA } from '@suite-actions/constants';

class DropboxProvider implements AbstractMetadataProvider {
    client: Dropbox;
    connected = false;
    user: DropboxTypes.users.FullAccount | undefined;
    type: 'dropbox';

    constructor(token?: string) {
        this.client = new Dropbox({ clientId: METADATA.DROPBOX_CLIENT_ID, fetch });
        if (token) {
            this.client.setAccessToken(token);
        }
        this.type = 'dropbox';
    }

    async connect() {
        const url = this.client.getAuthenticationUrl(getOauthReceiverUrl(), 'TODO:RandomToken');

        try {
            const token = await getMetadataOauthToken(url);

            this.client.setAccessToken(token);
            this.connected = true;
            return true;
        } catch (error) {
            // return false;
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.client.authTokenRevoke();
            return true;
        } catch (error) {
            // todo: silent error, maybe ok here?
            return false;
        }
    }

    async getFileContent(file: string) {
        try {
            const exists = await this.client.filesSearch({
                path: '',
                query: `${file}.mtdt`,
            });
            if (exists && exists.matches.length > 0) {
                const file = await this.client.filesDownload({
                    path: exists.matches[0].metadata.path_lower!,
                });
                // @ts-ignore: fileBlob not defined?
                const buffer = await file.fileBlob.arrayBuffer();
                return buffer;
            }
        } catch (error) {
            throw error;
        }
    }

    async setFileContent(file: string, content: Buffer) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=UTF-8' });
            await this.client.filesUpload({
                path: `/Apps/TREZOR/${file}.mtdt`,
                contents: blob,
                // @ts-ignore "overwrite" !== string?
                mode: 'overwrite',
            });
        } catch (error) {
            throw error;
        }
    }

    isConnected() {
        return this.connected;
    }

    isLoading() {
        return false;
    }

    async getCredentials() {
        const account = await this.client.usersGetCurrentAccount();
        return {
            type: 'dropbox',
            token: this.client.getAccessToken(),
            user: account.name.given_name,
        } as const;
    }
}

export default DropboxProvider;
