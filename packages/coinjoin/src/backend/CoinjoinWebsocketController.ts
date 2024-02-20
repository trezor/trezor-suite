import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';

import { HTTP_REQUEST_TIMEOUT, WS_CONNECT_TIMEOUT } from '../constants';
import { resetIdentityCircuit } from '../utils/http';
import type { Logger } from '../types';
import { identifyWsError } from './backendUtils';

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
    private defaultIdentity = 'WebsocketDefault';

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
                connectionTimeout: WS_CONNECT_TIMEOUT,
                url,
                headers: { 'Proxy-Authorization': `Basic ${identity}` },
                onSending: this.logMessages(socketId),
            });
            this.sockets[socketId] = socket;
        }
        if (!socket.isConnected()) {
            try {
                await socket.connect();
            } catch (err) {
                delete this.sockets[socketId];
                socket.dispose();
                if (
                    identifyWsError(err) === 'ERROR_FORBIDDEN' &&
                    identity === this.defaultIdentity
                ) {
                    this.defaultIdentity = resetIdentityCircuit(this.defaultIdentity);
                }
                throw err;
            }
            this.logger?.debug(`WS OPENED ${socketId}`);
            socket.once('disconnected', () => {
                this.logger?.debug(`WS CLOSED ${socketId}`);
            });
        }

        return socket;
    }

    private logMessages(
        socketId: string,
    ): ConstructorParameters<typeof BlockbookAPI>[0]['onSending'] {
        return ({ method, params }) =>
            this.logger?.debug(`WS ${method} ${JSON.stringify(params)} ${socketId}`);
    }

    private getSocketId(url: string, identity = this.defaultIdentity): SocketId {
        return `${identity}@${url}`;
    }
}
