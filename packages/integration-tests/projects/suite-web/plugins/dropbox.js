const express = require('express');
const bodyParser = require('body-parser');

const port = 30002;

// real expires in 14400
const expires_in = 14400;

/**
 * Mock implementation of Dropbox service intended to be used in e2e tests.
 */
class DropboxMock {
    constructor() {
        this.files = {};
        this.nextResponse = null;
        // store requests for assertions in tests
        this.requests = [];

        const app = express();

        app.use(bodyParser.json());

        app.use((req, res, next) => {
            this.requests.push(req.url);

            if (this.nextResponse) {
                console.log('[dropboxMock]', this.nextResponse);
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
                    expires_in,
                    token_type: 'bearer',
                    refresh_token: 'dropbox-refresh-token',
                    account_id: 'dbid:account-id',
                });
            }

            if (grant_type === 'refresh_token') {
                return res.send({
                    token_type: 'bearer',
                    access_token: 'dropbox-access-token',
                    expires_in,
                    expires_in: 60,
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
            res.writeHeader(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(user));
            res.end();
        });

        // https://api.dropboxapi.com/2/files/search
        app.post('/2/files/search', bodyParser.raw(), (req, res) => {
            const { query } = req.body;

            const file = this.files[`/apps/trezor/${query}`];

            res.writeHeader(200, { 'Content-Type': 'application/json' });

            if (file) {
                res.write(
                    JSON.stringify({
                        matches: [
                            {
                                match_type: { '.tag': 'filename' },
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
            const dropboxApiArgs = JSON.parse(req.headers['dropbox-api-arg']);
            const { path } = dropboxApiArgs;
            const name = path.replace('/apps/trezor/', '');

            const file = this.files[path];

            if (file) {
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
            bodyParser.raw({ type: 'application/octet-stream' }),
            (req, res) => {
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
            this.app.listen(port, server => {
                console.log(`[mockDropbox] listening at http://localhost:${port}`);
                this.running = true;
                this.server = server;
                resolve();
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

const dropboxMock = new DropboxMock();

module.exports = dropboxMock;
