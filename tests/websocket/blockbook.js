/* @flow */

import { Server } from 'ws';
import assert from 'assert';
import getFreePort from './freePort';
import responses from './fixtures/blockbook';

let fixture: ?string = null;

export const setFixture = (f?: string) => {
    fixture = f;
};

const createResponse = (request: any, response: any) => {
    const data = typeof fixture === 'string' ? response[fixture] : response;
    const result = {
        id: request.id,
        data,
    };
    return JSON.stringify(result);
};

const create = async () => {
    const port = await getFreePort();

    const server = new Server({ port, noServer: true });

    const close = server.close;
    server.close = () => {
        close.call(server);
    };

    server.on('connection', connection => {
        connection.on('message', json => {
            try {
                const request = JSON.parse(json);
                if (!request || typeof request.method !== 'string') {
                    throw new Error('Unknown request');
                }
                server.emit(request.method, request, connection);
            } catch (error) {
                assert(false, error.message);
            }
        });
    });

    server.config = {};

    server.on('getInfo', (request, connection) => {
        connection.send(createResponse(request, responses.getInfo));
    });

    server.on('getAccountInfo', (request, connection) => {
        connection.send(createResponse(request, responses.getAccountInfo.normal));
    });

    server.on('getBlockHash', (request, connection) => {
        connection.send(createResponse(request, responses.getBlockHash.normal));
    });

    server.on('getTransaction', (request, connection) => {
        connection.send(createResponse(request, responses.getTransaction.normal));
    });

    server.on('getTransactionSpecific', (request, connection) => {
        connection.send(createResponse(request, responses.getTransactionSpecific.normal));
    });

    server.on('estimateFee', (request, connection) => {
        connection.send(createResponse(request, responses.estimateFee.normal));
    });

    server.on('sendTransaction', (request, connection) => {
        connection.send(createResponse(request, responses.sendTransaction.normal));
    });

    server.on('subscribeNewBlock', (request, connection) => {
        connection.send(createResponse(request, responses.subscribeNewBlock.normal));
    });

    server.on('unsubscribeNewBlock', (request, connection) => {
        connection.send(createResponse(request, responses.unsubscribeNewBlock.normal));
    });

    server.on('unsubscribeAddresses', (request, connection) => {
        connection.send(createResponse(request, responses.unsubscribeAddresses.normal));
    });

    return server;
};

export default create;
