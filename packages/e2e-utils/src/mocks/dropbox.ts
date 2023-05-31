/* eslint-disable camelcase, no-console */

import express, { Express } from 'express';

const port = 30002;

/**
 * Mock implementation of Dropbox service intended to be used in e2e tests.
 */
export class DropboxMock {
    files: Record<string, Buffer> = {};
    uploadSessionFiles: Record<string, Buffer> = {};
    nextResponse: null | Record<string, any> = null;
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

            if (this.nextResponse) {
                console.log('[dropboxMock]', this.nextResponse);
                // @ts-expect-error
                res.writeHeader(this.nextResponse.status, this.nextResponse.headers);
                res.write(JSON.stringify(this.nextResponse.body));
                res.end();
                this.nextResponse = null;
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

            const file = this.files[`/apps/trezor/${query}`];

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

        // https://api.dropboxapi.com/2/files/list_folder
        app.post('/2/files/list_folder', (_req, res) => {
            const entries = Object.keys(this.files).map(name => {
                const formattedName = name.replace('/apps/trezor/', '');

                return { name: formattedName };
            });

            res.write(
                JSON.stringify({
                    entries,
                }),
            );

            return res.send();
        });

        // https://api.dropboxapi.com/2/files/upload_session/start_batch
        app.post('/2/files/upload_session/start_batch', (req, res) => {
            const { num_sessions } = req.body as { num_sessions: number };

            res.write(
                JSON.stringify({
                    session_ids: Array.from({ length: num_sessions }, (_, i) => i),
                }),
            );

            return res.send();
        });

        // https://content.dropboxapi.com/2/files/upload_session/append_v2
        app.post('/2/files/upload_session/append_v2', (req, res) => {
            // @ts-expect-error
            const dropboxApiArgs = JSON.parse(req.headers['dropbox-api-arg']);
            const { cursor } = dropboxApiArgs;
            const file = req.body;

            this.uploadSessionFiles[cursor.session_id] = file;

            return res.send();
        });

        // https://content.dropboxapi.com/2/files/upload_session/finish_batch_v2
        app.post('/2/files/upload_session/finish_batch_v2', (req, res) => {
            const { entries } = req.body as {
                entries: Array<{
                    cursor: {
                        session_id: number;
                    };
                    commit: {
                        path: string;
                    };
                }>;
            };

            entries.forEach(({ cursor, commit }) => {
                const file = this.uploadSessionFiles[cursor.session_id];
                this.files[`/apps/trezor${commit.path.toLowerCase()}`] = file;
            });

            return res.send();
        });

        // https://content.dropboxapi.com/2/files/download
        app.post('/2/files/download', (req, res) => {
            // @ts-expect-error
            const dropboxApiArgs = JSON.parse(req.headers['dropbox-api-arg']);
            const { path } = dropboxApiArgs;
            const name = path.replace('/apps/trezor/', '');

            const file = this.files[path];

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
                const { path } = dropboxApiArgs as { path: string };

                let formattedPath = path;
                if (!path.includes('apps/trezor')) {
                    formattedPath = `/apps/trezor${path}`;
                }

                this.files[formattedPath.toLowerCase()] = req.body;

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
        this.nextResponse = null;
        this.requests = [];
    }
}
