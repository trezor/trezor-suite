/* eslint-disable no-console */

import express, { Express } from 'express';

const port = 30002;

/**
 * Mock implementation of Dropbox service intended to be used in e2e tests.
 */
export class DropboxMock {
    files: Record<string, any> = {};
    nextResponse: Record<string, any>[] = [];
    // store requests for assertions in tests
    requests: string[] = [];
    app?: Express;
    running?: boolean;
    server?: any;

    constructor() {
        const app = express();

        app.use(express.json());

        app.use((req, res, next) => {
            this.requests.push(req.url);

            if (this.nextResponse.length) {
                const response = this.nextResponse.shift();
                console.log('[dropboxMock]', response);
                // @ts-expect-error
                res.writeHeader(response.status, response.headers);
                res.write(JSON.stringify(response!.body));
                res.end();

                return;
            }
            next();
        });

        // testing route
        app.get('/', (_req, res) => {
            res.send(JSON.stringify(this.files, null, 2));
        });

        // https://api.dropboxapi.com/oauth2/token
        app.post('/oauth2/token', (req, res) => {
            console.log('[dropbox]: token');

            const { grant_type } = req.query;
            if (grant_type === 'authorization_code') {
                return res.send({
                    uid: '123',
                    access_token: 'dropbox-access-token',
                    expires_in: 14400,
                    token_type: 'bearer',
                    refresh_token: 'dropbox-refresh-token',
                    account_id: 'dbid:account-id',
                });
            }

            if (grant_type === 'refresh_token') {
                return res.send({
                    token_type: 'bearer',
                    access_token: 'dropbox-access-token',
                    expires_in: 14400,
                });
            }

            return res.send('foo bar');
        });

        // https://api.dropboxapi.com/2/users/get_current_account
        app.post('/2/users/get_current_account', (_req, res) => {
            const user = {
                name: {
                    given_name: 'dog',
                    surname: 'cat',
                    familiar_name: 'kitty-dog',
                    display_name: 'dog-cat',
                    abbreviated_name: 'DC',
                },
                email: 'some@mail.com',
                email_verified: true,
                profile_photo_url: 'foo',
                disabled: false,
                country: 'CZ',
                locale: 'en',
                referral_link: 'foo',
                is_paired: false,
            };

            // this is because dropbox lib relies on not having default content-type
            // set by express application/json; charset=utf-8
            // it accepts only application/json;
            // @ts-expect-error
            res.writeHeader(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(user));
            res.end();
        });

        // https://api.dropboxapi.com/2/files/search_v2
        app.post('/2/files/search_v2', express.raw(), (req, res) => {
            const { query } = req.body;

            const file = this.files[`/${query}`];

            // @ts-expect-error
            res.writeHeader(200, { 'Content-Type': 'application/json' });

            if (file) {
                res.write(
                    JSON.stringify({
                        has_more: false,
                        matches: [
                            {
                                match_type: { '.tag': 'filename' },
                                metadata: {
                                    '.tag': 'metadata',
                                    metadata: {
                                        '.tag': 'file',
                                        name: query,
                                        path_lower: `/apps/trezor/${query}`,
                                        path_display: `/Apps/TREZOR/${query}`,
                                        id: 'id:foo-id',
                                        client_modified: '2020-10-07T09:52:45Z',
                                        server_modified: '2020-10-07T09:52:45Z',
                                        rev: '5b111ad693ec7a14c4460',
                                        size: 89,
                                        is_downloadable: true,
                                        content_hash: 'foo-hash',
                                    },
                                },
                            },
                        ],
                    }),
                );
            } else {
                res.write(JSON.stringify({ matches: [], more: false, start: 0 }));
            }

            res.end();
        });

        // https://content.dropboxapi.com/2/files/download
        app.post('/2/files/download', (req, res) => {
            // @ts-expect-error
            const dropboxApiArgs = JSON.parse(req.headers['dropbox-api-arg']);
            const { path } = dropboxApiArgs;
            const name = path.replace('/apps/trezor', '');

            const file = this.files[name];

            if (file) {
                // @ts-expect-error
                res.writeHeader(200, {
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-Api-Result': `{"name": "${name}", "path_lower": "${path}", "path_display": "/Apps/TREZOR/${name}", "id": "id:foo-bar", "client_modified": "2020-10-07T09:52:45Z", "server_modified": "2020-10-07T09:52:45Z", "rev": "foo-bar", "size": 666, "is_downloadable": true, "content_hash": "foo-bar"}`,
                });

                res.write(file, 'binary');
            } else {
                console.error('[dropboxMock]: no such file found', file);
            }

            return res.end();
        });

        // https://content.dropboxapi.com/2/files/upload
        app.post(
            '/2/files/upload',
            express.raw({ type: 'application/octet-stream' }),
            (req, res) => {
                // @ts-expect-error
                const dropboxApiArgs = JSON.parse(req.headers['dropbox-api-arg']);
                const { path } = dropboxApiArgs;
                this.files[path.toLowerCase()] = req.body;

                res.send();
            },
        );

        this.app = app;
    }

    start() {
        if (this.running) {
            this.reset();

            return;
        }

        console.log('[mockDropbox]: start');

        return new Promise(resolve => {
            // @ts-expect-error
            this.app!.listen(port, server => {
                console.log(`[mockDropbox] listening at http://localhost:${port}`);
                this.running = true;
                this.server = server;
                resolve(undefined);
            });
        });
    }

    stop() {
        console.log('[mockDropbox]: stop');
        if (this.server) {
            this.server.close();
        }
    }

    reset() {
        console.log('[mockDropbox]: reset');
        this.files = {};
        this.nextResponse = [];
        this.requests = [];
    }
}
