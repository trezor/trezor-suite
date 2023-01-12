// todo: not finished

// ts-nocheck
/* eslint-disable @typescript-eslint/no-use-before-define */

import * as net from 'net';
import * as http from 'http';
import { createDeferred, Deferred } from '@trezor/utils';
import { Descriptor } from '@trezor/transport';

const DEFAULT = {
    enumerate: [],
    listen: [],
    init: { githash: 'unknown', version: '1.2.3' },
    // call: {
    //     results: [],
    // },
    // acquire: {
    //     results: [],
    // },
    // release: {
    //     results: [],
    // },
};

const getFreePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => {
                resolve(port);
            });
        });
    });

let descriptors: Descriptor = [];

const updateDescriptors = (nextDescriptors: Descriptor[]) => {
    descriptors = nextDescriptors;
    if (listeningPromise?.promise) {
        listeningPromise.resolve(descriptors);

        listeningPromise = undefined;
    }
};

let listeningPromise: Deferred<any> | undefined;

const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse, testResponse?: any) => {
    if (res.writableEnded) return; // send default response if res.end wasn't called in test

    res.setHeader('Content-Type', 'application/json');
    if (testResponse) {
        res.write(JSON.stringify(testResponse));
        res.end();
        return;
    }

    if (!req.url) {
        throw new Error('no url');
    }
    console.log(req.url);
    const [, endpoint] = req.url.split('/');

    if (!endpoint) {
        // '/' endpoint
        const data = DEFAULT.init;
        res.write(JSON.stringify(data));
        res.end();
    } else if (endpoint === 'listen') {
        listeningPromise = createDeferred();
        listeningPromise.promise.then(descriptors => {
            res.write(JSON.stringify(descriptors));
            res.end();
        });
    } else if (endpoint === 'acquire') {
        res.write(JSON.stringify({ session: descriptors[0].session }));
        res.end();
    } else {
        const data = DEFAULT[endpoint as keyof typeof DEFAULT] || {};
        res.write(JSON.stringify(data));
        res.end();
    }
};

// export type Server = http.Server;
export interface Server extends http.Server {
    requestOptions: any;
}

export const createServer = async (): Promise<Server> => {
    const port = await getFreePort();

    const server = http.createServer((req, res) => {
        server.emit('test-handle-request', req);
        if (server.listenerCount('test-request') > 0) {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            });
            req.on('end', () => {
                server.emit(
                    'test-request',
                    {
                        url: req.url || '',
                        data: data && JSON.parse(data),
                    },
                    req,
                    res,
                );
            });
            // notify test and wait for the response
            req.on('test-response', (responseData: any) => {
                handleRequest(req, res, responseData);
            });
        } else {
            handleRequest(req, res);
        }
    });
    server.listen(port);

    server.requestOptions = {
        port,
        updateDescriptors,
        // signal: new AbortController().signal,
        // log: () => {},
        descriptors,
    };

    return server;
};
