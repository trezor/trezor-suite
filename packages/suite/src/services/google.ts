/* eslint camelcase: 0 */

/**
 * This is a custom implementation of Google OAuth authorization code flow with a fallback to an implicit flow. The documentation and packages
 * (we originally used google-auth-library-nodejs) recommend using one way or the other, but since we had to implement the authorization code
 * flow for the desktop app anyway, we enabled it for the web app as well for users' convenience. We also use the implicit flow as a backup if
 *  our authorization server (which holds a client secret necessary for the authorization code flow) is not available.
 */

import { METADATA } from '@suite-actions/constants';
import { Tokens } from '@suite-types/metadata';
import { extractCredentialsFromAuthorizationFlow, getOauthReceiverUrl } from '@suite-utils/oauth';
import { getCodeChallenge } from '@suite-utils/random';

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BOUNDARY = '-------314159265358979323846';
const AUTH_SERVER_URL = ''; // set to 'http://localhost:3005' for development

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

type Flow = 'implicit' | 'code';

/**
 * This class provides communication interface with selected google rest APIs:
 * - oauth v2
 * - drive v3
 */
class Client {
    static nameIdMap: Record<string, string>;
    static listPromise?: Promise<ListResponse>;
    static flow: Flow;
    static clientId = '';
    static authServerAvailable = false;
    static initPromise: Promise<Client> | undefined;
    static accessToken: string;
    static refreshToken: string;

    static init({ accessToken, refreshToken }: Tokens) {
        Client.initPromise = new Promise(resolve => {
            Client.nameIdMap = {};
            Client.isAuthServerAvailable().then(result => {
                // if our server providing the refresh token is not available, fallback to a flow with access tokens only (authorization for a limited time)
                Client.flow = result ? 'code' : 'implicit';
                // the app has two sets of credentials to enable both OAuth flows
                Client.clientId =
                    Client.flow === 'code'
                        ? METADATA.GOOGLE_CODE_FLOW_CLIENT_ID
                        : METADATA.GOOGLE_IMPLICIT_FLOW_CLIENT_ID;
                if (refreshToken) {
                    Client.refreshToken = refreshToken;
                }
                if (accessToken) {
                    Client.accessToken = accessToken;
                }

                resolve(Client);
            });
        });
    }

    static async getAccessToken() {
        await Client.initPromise;
        if (!Client.accessToken && Client.refreshToken && Client.flow === 'code') {
            const res = await fetch(`${AUTH_SERVER_URL}/google-oauth-refresh`, {
                method: 'POST',
                body: JSON.stringify({
                    clientId: Client.clientId,
                    refreshToken: Client.refreshToken,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const json = await res.json();
            if (!json?.access_token) {
                throw new Error('Could not refresh access token.');
            } else {
                Client.accessToken = json.access_token;
            }
        }
        return Client.accessToken;
    }

    static async isAuthServerAvailable() {
        if (!AUTH_SERVER_URL) {
            Client.authServerAvailable = false;
        } else {
            try {
                Client.authServerAvailable = (await fetch('http://localhost:3005/status')).ok;
            } catch (err) {
                Client.authServerAvailable = false;
            }
        }

        return Client.authServerAvailable;
    }

    static async authorize() {
        await Client.initPromise;
        const redirectUri = await getOauthReceiverUrl();
        if (!redirectUri) return;

        const random = getCodeChallenge();

        const options = {
            client_id: Client.clientId,
            redirect_uri: redirectUri,
            scope: SCOPES,
        };

        if (Client.flow === 'code') {
            // authorization code flow with PKCE
            Object.assign(options, {
                code_challenge: random,
                code_challenge_method: 'plain',
                response_type: 'code',
            });
        } else {
            // implicit flow
            Object.assign(options, {
                response_type: 'token',
            });
        }

        const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
            options,
        ).toString()}`;
        const response = await extractCredentialsFromAuthorizationFlow(url);
        const { access_token, code } = response;
        if (access_token) {
            // implicit flow returns short lived access_token directly
            Client.accessToken = access_token;
        } else {
            // authorization code flow retrieves code, then refresh_token, which can generate access_token on demand
            const res = await fetch(`${AUTH_SERVER_URL}/google-oauth-init`, {
                method: 'POST',
                body: JSON.stringify({
                    clientId: Client.clientId,
                    code,
                    codeVerifier: random,
                    redirectUri,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const json = await res.json();
            Client.accessToken = json.access_token;
            Client.refreshToken = json.refresh_token;
        }
    }

    /**
     * implementation of https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#tokenrevoke
     */
    static revoke() {
        // revoking an access token also invalidates any corresponding refresh token
        const promise = Client.call(
            `https://oauth2.googleapis.com/revoke?token=${Client.accessToken}`,
            {
                method: 'POST',
            },
        );
        Client.accessToken = '';
        Client.refreshToken = '';
        return promise;
    }

    static async getTokenInfo(): Promise<GetTokenInfoResponse> {
        const response = await Client.call(
            `https://www.googleapis.com/drive/v3/about?fields=user`,
            { method: 'GET' },
            {},
        );
        return response.json();
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/list
     */
    static async list(params: ListParams): Promise<ListResponse> {
        const response = await Client.call(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'GET',
            },
            params,
        );

        const json: ListResponse = await response.json();

        Client.nameIdMap = {};
        json.files.forEach(file => {
            Client.nameIdMap[file.name] = file.id;
        });

        // hmm this is a rare case that probably can't be solved in elegant way. User may somehow (manually, or some race condition)
        // create multiple files with same name (file.mtdt, file.mtdt). They can both exist in Google Drive simultaneously and
        // drive has no problem with it as they have different id. What makes this case even more confusing is that list requests
        // returns array of files in randomized order. So user is seeing and is saving his data in one session to file.mtdt(id: A) but
        // then to file.mtdt(id: B) in another session. So this warn should help as debug if this mysterious bug appears some day...
        if (Object.keys(Client.nameIdMap).length < json.files.length) {
            console.warn(
                'There are multiple files with the same name in Google Drive. This may happen as a result of race condition bug in application.',
            );
        }

        return json;
    }

    /**
     * implementation of https://developers.google.com/drive/api/v3/reference/files/get
     */
    static async get(params: GetParams, id: string) {
        const response = await Client.call(
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
    static async create(params: CreateParams, payload: string): Promise<CreateResponse> {
        params.body = Client.getWriteBody(params.body, payload);
        const response = await Client.call(
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
    static async update(params: UpdateParams, payload: string, id: string) {
        params.body = Client.getWriteBody(params.body, payload);
        const response = await Client.call(
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
     * Google Drive does not support "get file by path or name concept", you can get file only by id. To get id you must use list api call.
     * so in theory, you would need 2 calls to get single file: first get list of files from which you would filter file id and then get call.
     * to avoid this, google class holds map of name-ids and performs list request only if it could not find required name in the map.
     */
    static async getIdByName(name: string, forceReload = false) {
        if (!forceReload && Client.nameIdMap[name]) {
            return Client.nameIdMap[name];
        }
        try {
            // request to list files might have already been dispatched and exist as unresolved promise, so wait for it here in that case
            if (Client.listPromise) {
                await Client.listPromise;
                Client.listPromise = undefined; // unset
                return Client.nameIdMap[name];
            }
            // refresh nameIdMap
            Client.listPromise = Client.list({
                query: { spaces: 'appDataFolder' },
            });
            await Client.listPromise;
        } finally {
            Client.listPromise = undefined; // unset
        }
        // request to list files might have already been dispatched and exist as unresolved promise, so wait for it here in that case

        return Client.nameIdMap[name];
    }

    private static getWriteBody(
        body: CreateParams['body'] | UpdateParams['body'],
        payload: string,
    ) {
        const delimiter = `\r\n--${BOUNDARY}\r\n`;
        const closeDelimiter = `\r\n--${BOUNDARY}--`;
        const contentType = 'text/plain;charset=UTF-8';

        const multipartRequestBody = `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(
            body,
        )}${delimiter}Content-Type: ${contentType}\r\n\r\n${payload}${closeDelimiter}`;

        return multipartRequestBody;
    }

    private static async call(url: string, fetchParams: RequestInit, apiParams?: ApiParams) {
        if (apiParams?.query) {
            const query = new URLSearchParams(apiParams.query as Record<string, string>).toString();
            url += `?${query}`;
        }
        const fetchOptions = {
            ...fetchParams,
            headers: {
                'Content-Type': 'application/json',
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

        const getTokenAndFetch = async (isRetry?: boolean) => {
            await Client.getAccessToken();
            Object.assign(fetchOptions.headers, {
                Authorization: `Bearer ${Client.accessToken}`,
            });
            let response = await fetch(url, fetchOptions);
            if (!isRetry && response.status === 401 && Client.refreshToken) {
                // refresh access token if expired and attempt the request again
                Client.accessToken = '';
                response = await getTokenAndFetch(true);
            } else if (response.status !== 200) {
                const error = await response.json();
                throw error;
            }
            return response;
        };

        const response = await getTokenAndFetch();
        return response;
    }
}

export default Client;
