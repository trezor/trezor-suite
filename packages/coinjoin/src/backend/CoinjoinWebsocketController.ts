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

    async getOrCreate(url: string, identity = this.defaultIdentity): Promise<BlockbookWS> {
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
            this.logger?.log(`WS OPEN ${socketId}`);
            await socket.connect();
            const onDisconnected = () => {
                this.logger?.log(`WS CLOSED ${socketId}`);
                socket.off('disconnected', onDisconnected);
            };
            socket.on('disconnected', onDisconnected);
        }
        return socket;
    }

    getSocketId(url: string, identity = this.defaultIdentity): SocketId {
        return `${identity}@${url}`;
    }
}
