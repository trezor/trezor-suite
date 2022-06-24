/* eslint camelcase: 0 */

/**
 * Reason why this file exists:
 * at the begging I did not like googleapis package (official from google) as it does not have browser support
 * but later I found out that it was possible to use google-auth-library, also official google package
 * which is also a part of googleapis only by little tweaking in webpack config. So, it might be possible (haven't tried yet)
 * to do the same with googleapis package
 */

import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { METADATA } from '@suite-actions/constants';
import { extractCredentialsFromAuthorizationFlow, getOauthReceiverUrl } from '@suite-utils/oauth';
import { getCodeChallenge } from '@suite-utils/random';
import { isDesktop } from '@suite-utils/env';

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BOUNDARY = '-------314159265358979323846';
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:3005'; // TODO: replace with server URL

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
    // static token?: string;
    static nameIdMap: Record<string, string>;
    static listPromise?: Promise<ListResponse>;
    static oauth2Client: OAuth2Client = new OAuth2Client({
        clientId: METADATA.GOOGLE_CLIENT_ID_DESKTOP,
    });
    static flow: 'online' | 'offline';
    static clientId = '';
    static authServerAvailable = false;
    static initPromise: Promise<Client> | undefined;

    // constructor(token?: string) {
    //     console.log('=====constructor=====');
    //     Client.token = token;
    //     Client.nameIdMap = {};
    //     Client.oauth2Client = new OAuth2Client({
    //         clientId: METADATA.GOOGLE_CLIENT_ID_DESKTOP,
    //     });
    // }

    static async getAvailableFlow(): Promise<'offline' | 'online'> {
        const isAuthServerAvailable = await Client.isAuthServerAvailable();

        if (isAuthServerAvailable) {
            if (isDesktop()) {
                return 'offline';
            }
            // web
            // return 'offline';
            return 'online';
        }
        if (isDesktop()) {
            // return 'offline'; // client_secret is missing
            return 'online'; // bunch of other problems
        }
        return 'online';
    }

    static setClientIdForFlow(flow: 'offline' | 'online') {
        if (flow === 'offline') {
            if (isDesktop()) {
                // console.log('using desktop id');
                Client.clientId = METADATA.GOOGLE_CLIENT_ID_DESKTOP;
                // tv
                // Client.clientId =
                // '461402843655-a67saht8v848ukj22biek69ibunaie33.apps.googleusercontent.com'; // native device not allowed with local uri
            } else {
                console.log('using web id');
                Client.clientId = METADATA.GOOGLE_CLIENT_ID_WEB;
            }
        } else {
            console.log('using web id');

            Client.clientId = METADATA.GOOGLE_CLIENT_ID_WEB;
        }
        return Client.clientId;
    }

    static init(accessToken = '', refreshToken = '') {
        Client.initPromise = new Promise(async resolve => {
            console.log('init google token');

            // Client.token = token;
            Client.nameIdMap = {};

            Client.flow = await Client.getAvailableFlow();
            console.log('==floooow==', Client.flow);
            const clientId = Client.setClientIdForFlow(Client.flow);

            Client.oauth2Client = new OAuth2Client({
                clientId,
            });

            // which token is going to be updated depends on platform
            // Client.oauth2Client.on('tokens', tokens => {
            //     console.log('tokens', tokens);
            //     if (tokens.refresh_token) {
            //         Client.token = tokens.refresh_token;
            //     }
            //     if (tokens.access_token) {
            //         Client.token = tokens.access_token;
            //     }
            // });

            console.log('INIT TOKENS: ', accessToken, refreshToken);
            // which token is going to be remembered depends on platform
            if (accessToken || refreshToken) {
                if (Client.flow === 'offline') {
                    console.log('init setCredentials isAuthServerAvailable');
                    Client.oauth2Client.setCredentials({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                } else {
                    console.log('init setCredentials');

                    Client.oauth2Client.setCredentials({
                        access_token: accessToken,
                    });
                }
            }

            resolve(Client);
        });
        return Client.initPromise;
    }

    static isTokenExpiring() {
        const expiryDate = Client.oauth2Client.credentials.expiry_date;
        return expiryDate
            ? expiryDate <= new Date().getTime() + Client.oauth2Client.eagerRefreshThresholdMillis
            : false;
    }

    static setCredentials(json: any) {
        console.log('setCredentials', json);
        if (json && json.expires_in) {
            json.expiry_date = new Date().getTime() + json.expires_in * 1000;
            delete json.expires_in;
        }
        Client.oauth2Client.emit('tokens', json);
        Client.oauth2Client.setCredentials(json);
    }

    static async getAccessToken() {
        await Client.initPromise;
        console.log(
            'getAccessToken Client.oauth2Client.credentials',
            Client.oauth2Client?.credentials,
            // this.token,
        );

        const { access_token, refresh_token } = Client.oauth2Client?.credentials || {};
        const shouldRefresh = Client.isTokenExpiring() || !!(!access_token && refresh_token);
        //! Client.oauth2Client.credentials.access_token || Client.isTokenExpiring();
        console.log(
            'shouldRefresh',
            shouldRefresh,
            Client.isTokenExpiring(),
            access_token,
            refresh_token,
        );
        if (shouldRefresh) {
            const res = await fetch(`${AUTH_SERVER_URL}/google-oauth-refresh`, {
                method: 'POST',
                body: JSON.stringify({
                    clientId: Client.clientId,
                    refreshToken: Client.oauth2Client.credentials.refresh_token,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const json = await res.json();
            console.log('refresh response', json);
            Client.setCredentials(json);
            if (!json?.access_token) {
                throw new Error('Could not refresh access token.');
            }
            return json.access_token;
        }
        return Client.oauth2Client.credentials.access_token; // || Client.token;
    }

    static async isAuthServerAvailable() {
        try {
            Client.authServerAvailable = (await fetch('http://localhost:3005/status')).ok;
        } catch (err) {
            Client.authServerAvailable = false;
        }
        return Client.authServerAvailable;
    }

    static async authorize() {
        await Client.initPromise;
        const redirectUri = await getOauthReceiverUrl();
        if (!redirectUri) return;

        const random = getCodeChallenge();

        const options = {
            scope: SCOPES,
            redirect_uri: redirectUri,
        };

        if (Client.flow === 'offline') {
            // authorization code flow with PKCE
            Object.assign(options, {
                access_type: 'offline',
                code_challenge: random,
                code_challenge_method: CodeChallengeMethod.Plain,
            });
        } else {
            // implicit flow
            Object.assign(options, {
                access_type: 'online',
                response_type: 'token',
                // response_type: 'code',
            });
        }

        console.log('options', options);

        const url = Client.oauth2Client.generateAuthUrl(options);
        console.log('url', url);
        const response = await extractCredentialsFromAuthorizationFlow(url);

        console.log('extractCredentialsFromAuthorizationFlow', response);

        const { access_token, code } = response;
        // implicit flow returns short lived access_token directly
        if (access_token) {
            console.log('access_token', access_token);
            // Client.token = access_token;
            Client.oauth2Client.setCredentials({ access_token });
            return;
        }

        if (Client.authServerAvailable) {
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
            Client.setCredentials(json);
            Client.oauth2Client.setCredentials(json);
        } else if (code) {
            // otherwise authorization code which is to be exchanged for tokens is retrieved
            const { tokens } = await Client.oauth2Client.getToken({
                code,
                redirect_uri: redirectUri,
                codeVerifier: random,
            });
            this.oauth2Client.setCredentials(tokens);
        }
    }

    /**
     * implementation of https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#tokenrevoke
     */
    static revoke() {
        console.log('Client.revoke');
        // if (!Client.token) return;
        const promise = Client.call(
            `https://oauth2.googleapis.com/revoke?token=${Client.oauth2Client.credentials.access_token}`,
            {
                method: 'POST',
            },
        );
        Client.setCredentials({});
        // Client.token = '';
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
        console.log('call', url, apiParams);
        const accessToken = await Client.getAccessToken();
        console.log('access token: ', accessToken);
        const fetchOptions = {
            ...fetchParams,
            headers: {
                'Content-Type': 'application/json',
                ...fetchParams.headers,
            },
        };

        if (accessToken) {
            Object.assign(fetchOptions.headers, {
                Authorization: `Bearer ${accessToken}`,
            });
        }

        if (apiParams?.body) {
            const body =
                typeof apiParams.body === 'string'
                    ? apiParams.body
                    : JSON.stringify(apiParams.body);
            Object.assign(fetchOptions, { body });
        }

        const response = await fetch(url, fetchOptions);
        if (response.status !== 200) {
            const error = await response.json();
            throw error;
        }
        return response;
    }
}

export default Client;
