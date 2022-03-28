const WebSocket = require('ws');
const { blockbookFixtures } = require('./blockbook');
const { rippleFixtures } = require('./ripple');
const { blockfrostFixtures } = require('./blockfrost');

const DEFAULT_RESPONSES = {
    blockbook: blockbookFixtures,
    ripple: rippleFixtures,
    blockfrost: blockfrostFixtures,
};

const createServer = () => {
    const server = new WebSocket.Server({ port: 18088, noServer: true });

    const processRequest = (ws, params, message) => {
        const request = JSON.parse(message);
        if (!request) {
            throw new Error('Unknown WsCacheServer request');
        }
        const serverResponses = DEFAULT_RESPONSES[params.type];
        if (!serverResponses) {
            throw new Error(`Unknown WsCacheServer responses for ${params.type}`);
        }

        const field = params.type === 'blockbook' ? 'method' : 'command';
        const command = request[field];
        if (!command) {
            throw new Error(`Unknown WsCacheServer request without ${field}`);
        }

        const fn = serverResponses[command];
        if (!fn) {
            throw new Error(`Unknown WsCacheServer response for ${command}`);
        }

        const data = fn(params, request);
        ws.send(JSON.stringify({ ...data, id: request.id }));
    };

    server.on('connection', (ws, request) => {
        // request.url starts with /?
        const query = new URLSearchParams(request.url.substring(2));
        const params = { type: query.get('type'), shortcut: query.get('shortcut') };
        ws.on('message', message => processRequest(ws, params, message));
    });

    return new Promise((resolve, reject) => {
        server.on('listening', () => resolve(server));
        server.on('error', error => reject(error));
    });
};

module.exports = {
    createServer,
};
