import { CustomError, MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, Response } from '@trezor/blockchain-link-types';

import { BaseWorker, CONTEXT } from '../baseWorker';
import { estimateFee } from './handlers/estimateFee';
import { getAccountBalanceHistory } from './handlers/getAccountBalanceHistory';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getAccountUtxo } from './handlers/getAccountUtxo';
import { getBlockHash } from './handlers/getBlockHash';
import { getInfo } from './handlers/getInfo';
import { getTransaction } from './handlers/getTransaction';
import { pushTransaction } from './handlers/pushTransaction';
import { subscribe } from './handlers/subscribe';
import { unsubscribe } from './handlers/unsubscribe';
import type { Request } from './types';
import { BlockfrostAPI } from './websocket';

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request);
        case MESSAGES.GET_BLOCK_HASH:
            return getBlockHash(request);
        case MESSAGES.GET_ACCOUNT_BALANCE_HISTORY:
            return getAccountBalanceHistory(request);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_ACCOUNT_UTXO:
            return getAccountUtxo(request);
        case MESSAGES.GET_TRANSACTION:
            return getTransaction(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class BlockfrostWorker extends BaseWorker<BlockfrostAPI> {
    cleanup() {
        if (this.api) {
            this.api.dispose();
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    protected isConnected(api: BlockfrostAPI | undefined): api is BlockfrostAPI {
        return api?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<BlockfrostAPI> {
        const { timeout, pingTimeout, keepAlive } = this.settings;

        const api = new BlockfrostAPI({
            url,
            timeout,
            pingTimeout,
            keepAlive,
            agent: this.proxyAgent,
        });
        await api.connect();

        api.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({
            id: -1,
            type: RESPONSES.CONNECTED,
        });

        return api;
    }

    disconnect() {
        if (this.api) {
            this.api.disconnect();
        }
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

// export worker factory used in src/index
export default function Blockfrost() {
    return new BlockfrostWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new BlockfrostWorker();
    onmessage = module.messageHandler.bind(module);
}
