/* @flow */

import { Server } from 'ws';
import assert from 'assert';
import getFreePort from './freePort';
import responses from './fixtures/ripple';

const createResponse = (request, response, overrides = {}) => {
    const result = {
        ...response,
        ...overrides,
        id: request.id,
    };
    // const change = response.result && !_.isEmpty(overrides) ?
    //   { id: request.id, result: result } : { id: request.id };
    return JSON.stringify(result);
};

const create = async () => {
    const port = await getFreePort();

    const server = new Server({ port, noServer: true });

    const close = server.close;
    server.close = () => {
        // if (mock.expectedRequests !== undefined) {
        //   const allRequestsMade = _.every(mock.expectedRequests, function (counter) {
        //     return counter === 0;
        //   });
        // if (!allRequestsMade) {
        //     const json = JSON.stringify(mock.expectedRequests, null, 2);
        //     const indent = '      ';
        //     const indented = indent + json.replace(/\n/g, '\n' + indent);
        //     assert(false, 'Not all expected requests were made:\n' + indented);
        //   }
        // }
        close.call(server);
    };

    server.on('connection', connection => {
        connection.on('message', json => {
            try {
                const request = JSON.parse(json);
                if (!request || typeof request.command !== 'string') {
                    throw new Error('Unknown request');
                }
                server.emit(`request_${request.command}`, request, connection);
            } catch (error) {
                assert(false, error.message);
            }
        });
    });

    server.config = {};

    server.on('request_subscribe', (request, connection) => {
        connection.send(createResponse(request, responses.subscribe));
    });

    server.on('request_server_info', (request, connection) => {
        connection.send(createResponse(request, responses.serverInfo.normal));
    });

    return server;
};

export default create;
