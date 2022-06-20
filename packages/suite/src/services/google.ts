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
import { isWeb, isDesktop } from '@suite-utils/env';

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
    token?: string;
    nameIdMap: Record<string, string>;
    listPromise?: Promise<ListResponse>;
    oauth2Client: OAuth2Client;

    constructor(token?: string) {
        this.token = token;
        this.nameIdMap = {};
        this.oauth2Client = new OAuth2Client({
            clientId: isWeb() ? METADATA.GOOGLE_CLIENT_ID_WEB : METADATA.GOOGLE_CLIENT_ID_DESKTOP,
        });

        // which token is going to be updated depends on platform
        this.oauth2Client.on('tokens', tokens => {
            if (tokens.refresh_token && isDesktop()) {
                this.token = tokens.refresh_token;
            }
            if (tokens.access_token && isWeb()) {
                this.token = tokens.access_token;
            }
        });

        // which token is going to be remembered depends on platform
        if (token && isDesktop()) {
            this.oauth2Client.setCredentials({
                refresh_token: token,
            });
        }
        if (token && isWeb()) {
            this.oauth2Client.setCredentials({
                access_token: token,
            });
        }
    }

    isTokenExpiring() {
        const expiryDate = this.oauth2Client.credentials.expiry_date;
        return expiryDate
            ? expiryDate <= new Date().getTime() + this.oauth2Client.eagerRefreshThresholdMillis
            : false;
    }

    setCredentials(json: any) {
        if (json && json.expires_in) {
            json.expiry_date = new Date().getTime() + json.expires_in * 1000;
            delete json.expires_in;
        }
        this.oauth2Client.emit('tokens', json);
        this.oauth2Client.setCredentials(json);
    }

    async getAccessToken() {
        const shouldRefresh = !this.oauth2Client.credentials.access_token || this.isTokenExpiring();
        if (shouldRefresh) {
            const res = await fetch(`${AUTH_SERVER_URL}/google-oauth-refresh`, {
                method: 'POST',
                body: JSON.stringify({
                    clientId: METADATA.GOOGLE_CLIENT_ID_DESKTOP,
                    refreshToken: this.oauth2Client.credentials.refresh_token,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const json = await res.json();
            this.setCredentials(json);
            if (!json.credentials?.access_token) {
                throw new Error('Could not refresh access token.');
            }
            return json.credentials.access_token;
        }
        return this.oauth2Client.credentials.access_token;
    }

    async authorize() {
        const redirectUri = await getOauthReceiverUrl();
        if (!redirectUri) return;

        const random = getCodeChallenge();

        const options = {
            scope: SCOPES,
            redirect_uri: redirectUri,
        };

        if (isDesktop() && (await fetch('http://localhost:3005/status')).ok) {
            // authorization code flow with PKCE
            Object.assign(options, {
                access_type: 'offline',
                code_challenge: random,
                code_challenge_method: CodeChallengeMethod.Plain,
            });
        } else {
            // implicit flow
            Object.assign(options, { access_type: 'online', response_type: 'token' });
        }

        const url = this.oauth2Client.generateAuthUrl(options);

        const response = await extractCredentialsFromAuthorizationFlow(url);

        const { access_token, code } = response;
        // implicit flow returns short lived access_token directly
        if (access_token) {
            this.token = access_token;
            this.oauth2Client.setCredentials({ access_token });
            return;
        }

        const res = await fetch(`${AUTH_SERVER_URL}/google-oauth-init`, {
            method: 'POST',
            body: JSON.stringify({
                clientId: METADATA.GOOGLE_CLIENT_ID_DESKTOP,
                code,
                codeVerifier: random,
                redirectUri,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const json = await res.json();
        this.setCredentials(json);
        this.oauth2Client.setCredentials(json);
    }

    /**
     * implementation of https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#tokenrevoke
     */
    revoke() {
        if (!this.token) return;
        const promise = this.call(`https://oauth2.googleapis.com/revoke?token=${this.token}`, {
            method: 'POST',
        });
        this.token = '';
        return promise;
    }

    async getTokenInfo(): Promise<GetTokenInfoResponse> {
        const response = await this.call(
            `https://www.googleapis.com/drive/v3/about?fields=user`,
            { method: 'GET' },
            {},
        );
        return response.json();
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
        // create multiple files with same name (file.mtdt, file.mtdt). They can both exist in Google Drive simultaneously and
        // drive has no problem with it as they have different id. What makes this case even more confusing is that list requests
        // returns array of files in randomized order. So user is seeing and is saving his data in one session to file.mtdt(id: A) but
        // then to file.mtdt(id: B) in another session. So this warn should help as debug if this mysterious bug appears some day...
        if (Object.keys(this.nameIdMap).length < json.files.length) {
            console.warn(
                'There are multiple files with the same name in Google Drive. This may happen as a result of race condition bug in application.',
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
     * Google Drive does not support "get file by path or name concept", you can get file only by id. To get id you must use list api call.
     * so in theory, you would need 2 calls to get single file: first get list of files from which you would filter file id and then get call.
     * to avoid this, google class holds map of name-ids and performs list request only if it could not find required name in the map.
     */
    async getIdByName(name: string, forceReload = false) {
        if (!forceReload && this.nameIdMap[name]) {
            return this.nameIdMap[name];
        }

        try {
            // request to list files might have already been dispatched and exist as unresolved promise, so wait for it here in that case
            if (this.listPromise) {
                await this.listPromise;
                this.listPromise = undefined; // unset
                return this.nameIdMap[name];
            }
            // refresh nameIdMap
            this.listPromise = this.list({
                query: { spaces: 'appDataFolder' },
            });
            await this.listPromise;
        } finally {
            this.listPromise = undefined; // unset
        }
        // request to list files might have already been dispatched and exist as unresolved promise, so wait for it here in that case

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

        const accessToken = await this.getAccessToken();

        const fetchOptions = {
            ...fetchParams,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
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
        if (response.status !== 200) {
            const error = await response.json();
            throw error;
        }
        return response;
    }
}

export default Client;
