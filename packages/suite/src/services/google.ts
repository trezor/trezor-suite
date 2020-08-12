/* eslint no-throw-literal: 0 */

import { Deferred, createDeferred } from '@suite-utils/deferred';
import { urlHashParams } from '@suite-utils/metadata';
import { getRandomId } from '@suite-utils/random';
import { getPrefixedURL } from '@suite-utils/router';

const CLIENT_ID = '842348096891-efhc485636d5t09klvrve0pi4njhq3l8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

const WINDOW_TITLE = 'Google auth popup';
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 720;
const WINDOW_PROPS = `width=${WINDOW_WIDTH},height=${WINDOW_HEIGHT},dialog=yes,dependent=yes,scrollbars=yes,location=yes`;
const BOUNDARY = '-------314159265358979323846';

// todos:
// use state in oauth https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#request-parameter-state

type QueryParams = {
    q?: string;
    alt?: string;
    spaces?: string;
    fields?: string;
    pageSize?: number;
};

type BodyParams =
    | {
          mimeType?: string;
          parents?: [string];
          name?: string;
      }
    | string;

interface ListParams {
    query?: QueryParams;
    body?: never;
}

type GetParams = {
    query?: QueryParams;
    body?: never;
};

type UpdateParams = {
    query?: never;
    body: BodyParams;
};

type CreateParams = {
    query?: never;
    body: BodyParams;
};

type ApiParams = ListParams | GetParams | UpdateParams | CreateParams;

type ListResponse = {
    files: [
        {
            kind: string;
            id: string;
            name: string;
            mimeType: string;
        },
    ];
};

type CreateResponse = {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
};

type GetTokenInfoResponse = {
    token: string;
    type: 'google';
    user: {
        displayName: string;
    };
};

/**
 * This class provides communication interface with selected google rest APIs:
 * - oauth v2
 * - drive v3
 */
class Client {
    token?: string;
    // status: number;
    nameIdMap: Record<string, string>;
    listPromise?: Promise<ListResponse>;

    constructor(token?: string) {
        this.token = token;
        // this.status = 0;
        this.nameIdMap = {};
    }

    async authorize() {
        const dfd: Deferred<string> = createDeferred();
        // eslint-disable-next-line
        const redirect_uri =
            `${window.location.origin}${getPrefixedURL('/static/oauth/oauth_receiver.html')}`;
        // eslint-disable-next-line
        console.log('redirect_uri', redirect_uri);
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.search = new URLSearchParams({
            // eslint-disable-next-line
            client_id: CLIENT_ID,
            scope: SCOPES,
            // eslint-disable-next-line
            include_granted_scopes: 'true',
            // eslint-disable-next-line
            response_type: 'token',
            // todo: add state!!
            state: getRandomId(30),
            // eslint-disable-next-line
            redirect_uri,
        }).toString();

        const onMessage = (e: MessageEvent) => {
            // filter non oauth messages
            if (
                ![
                    'https://track-suite.herokuapp.com',
                    'https://wallet.trezor.io',
                    window.location.origin,
                ].includes(e.origin)
            ) {
                return;
            }
            // console.warn('OnMessage', e, e.data);

            if (typeof e.data !== 'string') return;

            console.log(e);
            const params = urlHashParams(e.data);
            const token = params.access_token;
            console.warn('token', token);
            if (token) {
                this.token = token;
                console.warn('resolve');
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

        window.open(url.toString(), WINDOW_TITLE, WINDOW_PROPS);

        return dfd.promise;
    }

    /**
     * implementation of https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#tokenrevoke
     */
    async revoke() {
        if (!this.token) return;
        this.call(`https://oauth2.googleapis.com/revoke?token=${this.token}`, {
            method: 'POST',
        });
        this.token = '';
    }

    async getTokenInfo(): Promise<GetTokenInfoResponse> {
        const response = await this.call(
            `https://www.googleapis.com/drive/v3/about?fields=user&access_token=${this.token}`,
            // `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${this.token}`,
            { method: 'GET' },
            {},
        );
        const json = await response.json();
        return json;
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/list
     */
    async list(params: ListParams): Promise<ListResponse> {
        const response = await this.call(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'GET',
            },
            params,
        );

        const json: ListResponse = await response.json();
        console.warn('json', json);

        this.nameIdMap = {};
        json.files.forEach(file => {
            this.nameIdMap[file.name] = file.id;
        });
        return json;
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/get
     */
    async get(params: GetParams, id: string) {
        const response = await this.call(
            `https://www.googleapis.com/drive/v3/files/${id}`,
            {
                method: 'GET',
            },
            params,
        );
        return response.text();
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/create
     */
    async create(params: CreateParams, payload: string): Promise<CreateResponse> {
        params.body = this.getWriteBody(params.body, payload);
        const response = await this.call(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        typeof params.body === 'string'
                            ? `multipart/related; boundary="${BOUNDARY}"`
                            : 'application/json',
                },
            },
            params,
        );
        return response.json();
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/update
     */
    async update(params: UpdateParams, payload: string, id: string) {
        params.body = this.getWriteBody(params.body, payload);
        const response = await this.call(
            `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': `multipart/related; boundary="${BOUNDARY}"`,
                },
            },
            params,
        );
        return response.json;
    }

    /**
     * tldr: utility function that performs file search by its name and returns file name if file was found, otherwise returns undefined
     *
     * full story:
     * google drive does not support "get file by path or name concept", you can get file only by id. To get id you must use list api call.
     * so in theory, you would need 2 calls to get single file: first get list of files from which you would filter file id and then get call.
     * to avoid this, google class holds map of name-ids and performs list request only if it could not find required name in the map.
     */
    async getIdByName(name: string) {
        if (this.nameIdMap[name]) {
            return this.nameIdMap[name];
        }
        if (this.listPromise) {
            await this.listPromise;
            return this.nameIdMap[name];
        }
        // refresh nameIdMap
        const promise = this.list({
            query: { spaces: 'appDataFolder' },
        });

        this.listPromise = promise;
        await this.listPromise;

        return this.nameIdMap[name];
    }

    private getWriteBody(body: CreateParams['body'] | UpdateParams['body'], payload: string) {
        const delimiter = `\r\n--${BOUNDARY}\r\n`;
        const closeDelimiter = `\r\n--${BOUNDARY}--`;
        const contentType = 'text/plain;charset=UTF-8';

        const multipartRequestBody = `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(
            body,
        )}${delimiter}Content-Type: ${contentType}\r\n\r\n${payload}${closeDelimiter}`;

        return multipartRequestBody;
    }

    private async call(url: string, fetchParams: RequestInit, apiParams?: ApiParams) {
        if (apiParams?.query) {
            const query = new URLSearchParams(apiParams.query as Record<string, string>).toString();
            url += `?${query}`;
        }

        const fetchOptions = {
            ...fetchParams,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
                ...fetchParams.headers,
            },
        };

        if (apiParams?.body) {
            const body =
                typeof apiParams.body === 'string'
                    ? apiParams.body
                    : JSON.stringify(apiParams.body);
            Object.assign(fetchOptions, { body });
        }

        const response = await fetch(url, fetchOptions);
        console.warn('response', response);
        if (response.status === 200) return response;
        switch (response.status) {
            case 401:
            case 403:
                this.token = '';
                throw { response, status: response.status, error: 'authorization error' };
            default:
                console.error(response);
                throw {
                    response,
                    status: response.status,
                    error: 'error communicating with google drive',
                };
        }
    }
}

export default Client;
