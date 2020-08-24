/* eslint no-throw-literal: 0 */

import { getMetadataOauthToken, getOauthReceiverUrl } from '@suite-utils/oauth';
import { getRandomId } from '@suite-utils/random';
import { METADATA } from '@suite-actions/constants';

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
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
    nameIdMap: Record<string, string>;
    listPromise?: Promise<ListResponse>;

    constructor(token?: string) {
        this.token = token;
        this.nameIdMap = {};
    }

    async authorize() {
        // eslint-disable-next-line
        const redirect_uri = getOauthReceiverUrl();
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.search = new URLSearchParams({
            // eslint-disable-next-line
            client_id: METADATA.GOOGLE_CLIENT_ID,
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

        const token = await getMetadataOauthToken(String(url));
        this.token = token;
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

        this.nameIdMap = {};
        json.files.forEach(file => {
            this.nameIdMap[file.name] = file.id;
        });

        // hmm this is a rare case that probably can't be solved in elegant way. User may somehow (manually, or some race condition)
        // create multiple files with same name (file.mtdt, file.mtdt). They can both exist in google drive simultaneously and
        // drive has no problem with it as they have different id. What makes this case even more confusing is that list requests
        // returns array of files in randomized order. So user is seeing and is saving his data in one session to file.mtdt(id: A) but
        // then to file.mtdt(id: B) in another session. So this warn should help as debug if this mysterious bug appears some day...
        if (Object.keys(this.nameIdMap).length < json.files.length) {
            console.warn(
                'There are multiple files with the same name in google drive. This may happen as a result of race condition bug in application.',
            );
        }

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
                    'Content-Type': `multipart/related; boundary="${BOUNDARY}"`,
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
    async getIdByName(name: string, forceReload = false) {
        if (!forceReload && this.nameIdMap[name]) {
            return this.nameIdMap[name];
        }
        // request to list files might have already been dispatched and exist as unresolved promise, so wait for it here in that case
        if (this.listPromise) {
            await this.listPromise;
            this.listPromise = undefined; // unset
            return this.nameIdMap[name];
        }
        // refresh nameIdMap
        const promise = this.list({
            query: { spaces: 'appDataFolder' },
        });

        this.listPromise = promise;
        await this.listPromise;
        this.listPromise = undefined; // unset

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
        if (response.status === 200) return response;
        switch (response.status) {
            case 401:
            case 403:
                this.token = '';
                throw { response, status: response.status, error: 'authorization error' };
            default:
                throw {
                    response,
                    status: response.status,
                    error: 'error communicating with google drive',
                };
        }
    }
}

export default Client;
