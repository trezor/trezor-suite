import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';

import { HTTP_REQUEST_TIMEOUT } from '../constants';
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

type CoinjoinWebsocketParams = {
    url: string;
    timeout?: number;
    identity?: string;
};

export class CoinjoinWebsocketController {
    private readonly defaultIdentity = 'Default';

    protected readonly sockets: { [id: SocketId]: BlockbookAPI } = {};
    protected readonly logger;

    constructor({ logger }: CoinjoinWebsocketControllerSettings) {
        this.logger = logger;
    }

    async getOrCreate({
        url,
        timeout = HTTP_REQUEST_TIMEOUT,
        identity = this.defaultIdentity,
    }: CoinjoinWebsocketParams): Promise<BlockbookAPI> {
        const socketId = this.getSocketId(url, identity);
        let socket = this.sockets[socketId];
        if (!socket) {
            socket = new BlockbookAPI({
                timeout,
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
