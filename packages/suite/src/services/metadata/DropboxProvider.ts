import { Dropbox } from 'dropbox';
import { METADATA } from '@suite-actions/constants';
import { Deferred, createDeferred } from '@suite-utils/deferred';
import { AbstractMetadataProvider } from '@suite-types/metadata';
import { urlHashParams } from '@suite-utils/metadata';

const WINDOW_TITLE = 'DropboxAuthPopup';
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 720;
const WINDOW_PROPS = `width=${WINDOW_WIDTH},height=${WINDOW_HEIGHT},dialog=yes,dependent=yes,scrollbars=yes,location=yes`;

export const getOauthToken = (url: string) => {
    console.log('getOauthToken orig');
    const dfd: Deferred<string> = createDeferred();
    // const props = WINDOW_PROPS + this._getRelativePosition();
    const props = WINDOW_PROPS;

    const onMessage = (e: MessageEvent) => {
        // filter non oauth messages
        if (!['https://track-suite.herokuapp.com', window.location.origin].includes(e.origin)) {
            return;
        }

        if (typeof e.data !== 'string') return;

        const params = urlHashParams(e.data);

        const token = params.access_token;
        const { state } = params;

        console.warn('TOKEN', token, state);

        if (token) {
            dfd.resolve(token);
        } else {
            dfd.reject(new Error('Cancelled'));
        }
    };

    // @ts-ignore
    const { ipcRenderer } = global;
    if (ipcRenderer) {
        const onIpcMessage = (_sender: any, message: any) => {
            onMessage({ ...message, origin: 'herokuapp.com' });
            ipcRenderer.off('oauth', onIpcMessage);
        };
        ipcRenderer.on('oauth', onIpcMessage);
    } else {
        window.addEventListener('message', onMessage);
    }

    window.open(url, WINDOW_TITLE, props);

    return dfd.promise;
};

class DropboxProvider implements AbstractMetadataProvider {
    client: Dropbox;
    connected = false;
    user: DropboxTypes.users.FullAccount | undefined;
    type: 'dropbox';

    constructor(token?: string) {
        this.client = new Dropbox({ clientId: 'g5f5vaogrxvvrnv', fetch });
        if (token) {
            this.client.setAccessToken(token);
        }
        this.type = 'dropbox';
    }

    async connect() {
        // const hasToken = this.client.getAccessToken();
        const url = this.client.getAuthenticationUrl(METADATA.OAUTH_FILE, 'TODO:RandomToken');

        try {
            const token = await getOauthToken(url);

            this.client.setAccessToken(token);
            this.connected = true;
            return true;
        } catch (error) {
            console.warn('connect error', error);
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
                // mode: 'filename',
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
            console.warn('getFileContent error', error.status);
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
            console.warn('setFileContent error', error);
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
