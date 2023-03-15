import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';

import type { Logger } from '../types';

export type BlockbookWS = Pick<BlockbookAPI, 'getBlock' | 'getTransaction'>;

type SocketId = `${string}@${string}`;

type CoinjoinWebsocketControllerSettings = {
    logger?: Logger;
};

export class CoinjoinWebsocketController {
    private readonly defaultIdentity = 'Default';

    protected readonly sockets: { [id: SocketId]: BlockbookAPI } = {};
    protected readonly logger;

    constructor({ logger }: CoinjoinWebsocketControllerSettings) {
        this.logger = logger;
    }

    async getOrCreate(url: string, identity = this.defaultIdentity): Promise<BlockbookAPI> {
        const socketId = this.getSocketId(url, identity);
        let socket = this.sockets[socketId];
        if (!socket) {
            socket = new BlockbookAPI({
                url,
                headers: { 'Proxy-Authorization': `Basic ${identity}` },
            });
            this.sockets[socketId] = socket;
        }
        if (!socket.isConnected()) {
            await socket.connect();
            this.logger?.log(`WS OPENED ${socketId}`);
            socket.once('disconnected', () => {
                this.logger?.log(`WS CLOSED ${socketId}`);
            });
        }
        return socket;
    }

    getSocketId(url: string, identity = this.defaultIdentity): SocketId {
        return `${identity}@${url}`;
    }
}
