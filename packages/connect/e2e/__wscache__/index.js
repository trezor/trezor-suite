import { createServer } from './server.js';

// Change all "blockchain_link" urls to localhost.
// This method is used in karma.plugin.js and jest.setup.js
export const transformCoinsJson = json => {
    Object.keys(json).forEach(key => {
        json[key].forEach(coin => {
            if (coin.blockchain_link) {
                // Skip for Solana, it uses a combination of HTTP and WebSocket, therefore it is not supported currently
                if (coin.blockchain_link.type === 'solana') return;

                const query = `?type=${coin.blockchain_link.type}&shortcut=${coin.shortcut}&suffix=/websocket`;
                coin.blockchain_link.url = [`ws://localhost:18088/${query}`];
            }
        });
    });

    return json;
};

export { createServer };
