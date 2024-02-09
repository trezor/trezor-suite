/* eslint-disable no-console */

import express, { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

const BOUNDARY = '---------314159265358979323846';
const port = 30001;

class GoogleFile {
    id: string;
    name: string;
    mimeType: string;
    kind: string;
    data: Buffer;

    constructor(id: string, name: string, data: Buffer) {
        this.id = id;
        this.name = name;
        this.mimeType = 'text/plain';
        this.kind = 'drive#file';
        this.data = data;
    }

    toJSON() {
        return {
            name: this.name,
            id: this.id,
            mimeType: 'text/plain',
            kind: 'drive#file',
        };
    }
}

/**
 * Mock implementation of Google Drive service intended to be used in e2e tests.
 */
export class GoogleMock {
    files: Record<string, any> = {};
    nextResponse: Record<string, any>[] = [];
    // store requests for assertions in tests
    requests: string[] = [];
    app?: Express;
    running?: boolean;
    server?: any;
    user?: any;

    constructor() {
        this.reset();

        const app = express();

        app.use((req, res, next) => {
            this.requests.push(req.url);

            if (this.nextResponse.length) {
                const response = this.nextResponse.shift();
                console.log('[mockGoogleDrive]', response);
                //    @ts-expect-error
                res.writeHeader(response.status, response.headers);
                res.write(JSON.stringify(response!.body));
                res.end();
                return;
            }
            next();
        });

        app.use((_req, res, next) => {
            if (!this.user) {
                res.status(401);
                res.send();
                return;
            }
            return next();
        });

        const handleSave = (rawBody: any, id: string) => {
            const textContentType = 'Content-Type: text/plain;charset=UTF-8';
            const data = rawBody
                .substring(
                    rawBody.indexOf(textContentType) + textContentType.length,
                    rawBody.indexOf('---------314159265358979323846--'),
                )
                .replace(/\r?\n|\r/g, '');

            const jsonContentType = 'Content-Type: application/json';
            const jsonStr = rawBody
                .substring(
                    rawBody.indexOf(jsonContentType) + jsonContentType.length,
                    rawBody.indexOf(BOUNDARY, BOUNDARY.length),
                )
                .replace(/\r?\n|\r/g, '');

            const json = JSON.parse(jsonStr);
            if (id) {
                const file = Object.values(this.files).find(f => f.id === id);
                if (!file) throw new Error('no such file exists');
                file.data = data;
            } else {
                const file = new GoogleFile(uuidv4(), json.name, data);
                this.files[file.name] = file;
            }
        };

        app.post('/upload/drive/v3/files', express.text({ type: '*/*' }), (req, res) => {
            console.log('[mockGoogleDrive]: post');
            // @ts-expect-error
            handleSave(req.body);
            res.send({});
        });

        app.post('/revoke', (_req, res) => {
            console.log('[mockGoogleDrive]: revoke');
            res.send();
        });

        // oauth2 authorization code flow presumes exchanging 'code' for token through post request to /token endpoint
        app.post('/token', (_req, res) => {
            console.log('[mockGoogleDrive]: token');
            res.send({
                access_token: 'foo-token',
                expires_in: 3599,
                refresh_token: 'moo-token',
                scope: 'https://www.googleapis.com/auth/drive.appdata',
                token_type: 'Bearer',
            });
        });

        app.patch('/upload/drive/v3/files/:id', express.text({ type: '*/*' }), (req, res) => {
            console.log('[mockGoogleDrive]: patch', req.params.id);

            handleSave(req.body, req.params.id);
            res.send({});
        });

        app.get('/drive/v3/files/:id', express.json(), (req, res) => {
            const { id } = req.params;
            console.log('[mockGoogleDrive]: get', req.params.id);
            const file = Object.values(this.files).find(f => f.id === id);
            if (file) {
                return res.send(file.data);
            }
            res.status(404);
            res.send({
                error: {
                    code: 404,
                    message: `File not found for ${id}`,
                },
            });
        });

        app.get('/drive/v3/files', express.json(), (_req, res) => {
            res.json({
                files: Object.values(this.files),
            });
        });

        app.get('/drive/v3/about', express.json(), (_req, res) => {
            console.log('[mockGoogleDrive]: about');
            res.send({
                user: this.user,
            });
        });

        this.app = app;
    }

    start() {
        if (this.running) {
            this.reset();
            return;
        }

        console.log('[mockGoogleDrive]: start');

        return new Promise(resolve => {
            // @ts-expect-error
            this.app.listen(port, server => {
                console.log(`[mockGoogleDrive] listening at http://localhost:${port}`);
                this.running = true;
                this.server = server;
                resolve(undefined);
            });
        });
    }

    stop() {
        console.log('[mockGoogleDrive]: start');
        if (this.server) {
            this.server.close();
        }
    }

    reset() {
        console.log('[mockGoogleDrive]: reset');
        this.files = {};
        this.user = {
            kind: 'drive#user',
            displayName: 'Kryptonit',
        };
        this.nextResponse = [];
        this.requests = [];
    }

    setup(prop: any, value: any) {
        console.log('[mockGoogleDrive]: setup ', prop, value);

        // @ts-expect-error
        this[prop] = value;
        // @ts-expect-error
        console.log('[mockGoogleDrive] ', this[prop]);
    }

    setFile(name: string, content: any) {
        if (this.files[name]) {
            this.files[name] = new GoogleFile(
                this.files[name].id,
                this.files[name].name,
                content.toString('hex'),
            );
        } else {
            const file = new GoogleFile(uuidv4(), name, content.toString('hex'));
            this.files[file.name] = file;
        }
    }
}
