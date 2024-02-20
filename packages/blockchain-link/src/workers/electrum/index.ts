import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { BaseWorker, CONTEXT, ContextType } from '../baseWorker';
import * as M from './methods';
import * as L from './listeners';
import { createSocket } from './sockets';
import { CachingElectrumClient } from './client/caching';
import type { ElectrumClient } from './client/electrum';
import type { Response } from '@trezor/blockchain-link-types';
import { Message } from '@trezor/blockchain-link-types/lib/messages';

type BlockListener = ReturnType<typeof L.blockListener>;
type TxListener = ReturnType<typeof L.txListener>;

// reason:
// https://stackoverflow.com/questions/57103834/typescript-omit-a-property-from-all-interfaces-in-a-union-but-keep-the-union-s#answer-57103940
type Without<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type Request<T> = T extends any
    ? T & ContextType<ElectrumClient> & { blockListener: BlockListener; txListener: TxListener }
    : never;
type MessageType = Message['type'];
type ResponseType<T extends MessageType> = T extends typeof MESSAGES.GET_INFO
    ? typeof RESPONSES.GET_INFO
    : T extends typeof MESSAGES.GET_BLOCK_HASH
      ? typeof RESPONSES.GET_BLOCK_HASH
      : T extends typeof MESSAGES.GET_ACCOUNT_INFO
        ? typeof RESPONSES.GET_ACCOUNT_INFO
        : T extends typeof MESSAGES.GET_ACCOUNT_UTXO
          ? typeof RESPONSES.GET_ACCOUNT_UTXO
          : T extends typeof MESSAGES.GET_TRANSACTION
            ? typeof RESPONSES.GET_TRANSACTION
            : T extends typeof MESSAGES.GET_TRANSACTION_HEX
              ? typeof RESPONSES.GET_TRANSACTION_HEX
              : T extends typeof MESSAGES.GET_ACCOUNT_BALANCE_HISTORY
                ? typeof RESPONSES.GET_ACCOUNT_BALANCE_HISTORY
                : T extends typeof MESSAGES.ESTIMATE_FEE
                  ? typeof RESPONSES.ESTIMATE_FEE
                  : T extends typeof MESSAGES.PUSH_TRANSACTION
                    ? typeof RESPONSES.PUSH_TRANSACTION
                    : T extends typeof MESSAGES.SUBSCRIBE
                      ? typeof RESPONSES.SUBSCRIBE
                      : T extends typeof MESSAGES.UNSUBSCRIBE
                        ? typeof RESPONSES.UNSUBSCRIBE
                        : never;
type Reply<T extends MessageType> = Without<Extract<Response, { type: ResponseType<T> }>, 'id'>;

const onRequest = async <T extends Message>(
    request: Request<T>,
): Promise<Reply<typeof request.type>> => {
    const client = await request.connect();
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return {
                type: RESPONSES.GET_INFO,
                payload: await M.getInfo(client),
            };
        case MESSAGES.GET_BLOCK_HASH:
            return {
                type: RESPONSES.GET_BLOCK_HASH,
                payload: await M.getBlockHash(client, request.payload),
            };
        case MESSAGES.GET_ACCOUNT_INFO:
            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: await M.getAccountInfo(client, request.payload),
            };
        case MESSAGES.GET_ACCOUNT_UTXO:
            return {
                type: RESPONSES.GET_ACCOUNT_UTXO,
                payload: await M.getAccountUtxo(client, request.payload),
            };
        case MESSAGES.GET_TRANSACTION:
            return {
                type: RESPONSES.GET_TRANSACTION,
                payload: await M.getTransaction(client, request.payload),
            };
        case MESSAGES.GET_TRANSACTION_HEX:
            return {
                type: RESPONSES.GET_TRANSACTION_HEX,
                payload: await client.request('blockchain.transaction.get', request.payload, false),
            };
        case MESSAGES.GET_ACCOUNT_BALANCE_HISTORY:
            return {
                type: RESPONSES.GET_ACCOUNT_BALANCE_HISTORY,
                payload: await M.getAccountBalanceHistory(client, request.payload),
            };
        case MESSAGES.ESTIMATE_FEE:
            return {
                type: RESPONSES.ESTIMATE_FEE,
                payload: await M.estimateFee(client, request.payload),
            };
        case MESSAGES.PUSH_TRANSACTION:
            return {
                type: RESPONSES.PUSH_TRANSACTION,
                payload: await M.pushTransaction(client, request.payload),
            };
        case MESSAGES.SUBSCRIBE:
            switch (request.payload.type) {
                case 'block':
                    return {
                        type: RESPONSES.SUBSCRIBE,
                        payload: request.blockListener.subscribe(),
                    };
                case 'addresses':
                case 'accounts':
                    return {
                        type: RESPONSES.SUBSCRIBE,
                        payload: await request.txListener.subscribe(request.payload),
                    };
                default:
                    throw new CustomError(`Subscription ${request.payload.type} not implemented`);
            }
        case MESSAGES.UNSUBSCRIBE:
            switch (request.payload.type) {
                case 'block':
                    return {
                        type: RESPONSES.UNSUBSCRIBE,
                        payload: request.blockListener.unsubscribe(),
                    };
                case 'addresses':
                case 'accounts':
                    return {
                        type: RESPONSES.UNSUBSCRIBE,
                        payload: await request.txListener.unsubscribe(request.payload),
                    };
                default:
                    throw new CustomError(`Subscription ${request.payload.type} not implemented`);
            }
        // @ts-expect-error this message is used in tests
        case 'raw':
            // @ts-expect-error

            const { method, params } = request.payload;

            return client
                .request(method, ...params)
                .then((res: any) => ({ type: method, payload: res }));
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class ElectrumWorker extends BaseWorker<ElectrumClient> {
    private blockListener: BlockListener;
    private txListener: TxListener;

    constructor() {
        super();
        this.blockListener = L.blockListener(this);
        this.txListener = L.txListener(this);
    }

    protected isConnected(api: ElectrumClient | undefined): api is ElectrumClient {
        return api?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<ElectrumClient> {
        const { debug, timeout, keepAlive, name } = this.settings;

        const socket = createSocket(url, {
            timeout,
            keepAlive,
            proxyAgent: this.proxyAgent,
        });
        const api = new CachingElectrumClient();
        await api.connect(socket, {
            url,
            coin: name ?? 'BTC',
            debug,
            client: {
                name: 'blockchain-link',
                protocolVersion: '1.4',
            },
        });

        this.post({
            id: -1,
            type: RESPONSES.CONNECTED,
        });

        return api;
    }

    disconnect() {
        if (this.api?.isConnected()) {
            this.api.close();
        }
    }

    cleanup() {
        // TODO
        if (this.api) {
            this.api.close();
        }
        super.cleanup();
    }

    async messageHandler(event: { data: Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
                blockListener: this.blockListener,
                txListener: this.txListener,
            };
            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

// export worker factory used in src/index
export default function Electrum() {
    return new ElectrumWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new ElectrumWorker();
    onmessage = module.messageHandler.bind(module);
}
