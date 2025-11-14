export { createServer } from './server';

// Change all "blockchain_link" urls to localhost.
export const transformCoinsJson = (json: any) => {
    Object.keys(json).forEach(key => {
        json[key].forEach((coin: any) => {
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
