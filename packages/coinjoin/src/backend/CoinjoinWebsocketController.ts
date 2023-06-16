import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';

import { WS_MESSAGE_TIMEOUT } from '../constants';
import type { Logger } from '../types';

export type BlockbookWS = Pick<
    BlockbookAPI,
    | 'getBlock'
    | 'getTransaction'
    | 'getAccountInfo'
    | 'getServerInfo'
    | 'getBlockHash'
    | 'getMempoolFilters'
>;

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
                timeout: WS_MESSAGE_TIMEOUT,
                url,
                headers: { 'Proxy-Authorization': `Basic ${identity}` },
            });
            this.sockets[socketId] = socket;
        }
        if (!socket.isConnected()) {
            try {
                await socket.connect();
            } catch (err) {
                delete this.sockets[socketId];
                socket.dispose();
                throw err;
            }
            this.logger?.debug(`WS OPENED ${socketId}`);
            socket.once('disconnected', () => {
                this.logger?.debug(`WS CLOSED ${socketId}`);
            });
        }
        return socket;
    }

    getSocketId(url: string, identity = this.defaultIdentity): SocketId {
        return `${identity}@${url}`;
    }
}
