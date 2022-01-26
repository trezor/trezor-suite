import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import { BaseWorker, CONTEXT, ContextType } from '../base';
import { BlockfrostAPI } from './websocket';
import { transformUtxos, transformAccountInfo, transformTransaction } from './utils';
import type { SubscriptionAccountInfo } from '../../types/common';
import type { Response, Message } from '../../types';
import type { BlockfrostTransaction, BlockContent } from '../../types/blockfrost';
import type * as MessageTypes from '../../types/messages';

type Context = ContextType<BlockfrostAPI>;
type Request<T> = T & Context;

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const info = await api.getServerInfo();
    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.options.url,
            ...info,
        },
    } as const;
};

const getBlockHash = async (request: Request<MessageTypes.GetBlockHash>) => {
    const api = await request.connect();
    const blockMessage = await api.getBlockHash(request.payload);
    return {
        type: RESPONSES.GET_BLOCK_HASH,
        payload: blockMessage.hash,
    } as const;
};

const getAccountBalanceHistory = async (
    request: Request<MessageTypes.GetAccountBalanceHistory>
) => {
    const socket = await request.connect();
    const history = await socket.getAccountBalanceHistory(request.payload);
    return {
        type: RESPONSES.GET_ACCOUNT_BALANCE_HISTORY,
        payload: history,
    } as const;
};

const getTransaction = async (request: Request<MessageTypes.GetTransaction>) => {
    const api = await request.connect();
    const tx = await api.getTransaction(request.payload);
    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: {
            type: 'blockfrost',
            tx,
        },
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const resp = await api.estimateFee(request.payload);
    const feeOptions: { feePerUnit: string }[] = [];

    feeOptions.push({ feePerUnit: resp.lovelacePerByte.toString() });

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload: feeOptions,
    } as const;
};

const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const api = await request.connect();
    const payload = await api.pushTransaction(request.payload);
    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload,
    } as const;
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const api = await request.connect();
    const info = await api.getAccountInfo(request.payload);
    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: transformAccountInfo(info),
    } as const;
};

const getAccountUtxo = async (request: Request<MessageTypes.GetAccountUtxo>) => {
    const api = await request.connect();
    const utxos = await api.getAccountUtxo(request.payload);
    return {
        type: RESPONSES.GET_ACCOUNT_UTXO,
        payload: transformUtxos(utxos),
    } as const;
};

const onNewBlock = ({ post }: Context, event: BlockContent) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height || 0,
                blockHash: event.hash,
            },
        },
    });
};

const onTransaction = ({ state, post }: Context, event: BlockfrostTransaction) => {
    const descriptor = event.address;
    const account = state.getAccount(descriptor);

    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? transformTransaction(account.descriptor, account.addresses, event)
                    : transformTransaction(descriptor, undefined, event),
            },
        },
    });
};

const subscribeBlock = async (ctx: Context) => {
    if (ctx.state.getSubscription('block')) return { subscribed: true };
    const api = await ctx.connect();
    ctx.state.addSubscription('block');
    api.on('block', ev => onNewBlock(ctx, ev));
    return api.subscribeBlock();
};

const subscribeAccounts = async (ctx: Context, accounts: SubscriptionAccountInfo[]) => {
    const api = await ctx.connect();
    const { state } = ctx;
    state.addAccounts(accounts);
    if (!state.getSubscription('notification')) {
        api.on('notification', ev => onTransaction(ctx, ev));
        state.addSubscription('notification');
    }
    return api.subscribeAddresses(state.getAddresses());
};

const subscribeAddresses = async (ctx: Context, addresses: string[]) => {
    const api = await ctx.connect();
    const { state } = ctx;
    state.addAddresses(addresses);
    if (!state.getSubscription('notification')) {
        api.on('notification', ev => onTransaction(ctx, ev));
        state.addSubscription('notification');
    }
    return api.subscribeAddresses(state.getAddresses());
};

const subscribe = async (request: Request<MessageTypes.Subscribe>) => {
    const { payload } = request;

    let response: { subscribed: boolean };
    if (payload.type === 'accounts') {
        response = await subscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        response = await subscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        response = await subscribeBlock(request);
    } else {
        throw new CustomError('invalid_param', '+type');
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    } as const;
};

const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('block')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('block');
    state.removeSubscription('block');
    return api.unsubscribeBlock();
};

const unsubscribeAccounts = async (
    { state, connect }: Context,
    accounts?: SubscriptionAccountInfo[]
) => {
    state.removeAccounts(accounts || state.getAccounts());

    const api = await connect();
    const subscribed = state.getAddresses();
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.removeAllListeners('notification');
        state.removeSubscription('notification');
        return api.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return api.subscribeAddresses(subscribed);
};

const unsubscribeAddresses = async ({ state, connect }: Context, addresses?: string[]) => {
    const socket = await connect();
    // remove accounts
    if (!addresses) {
        state.removeAccounts(state.getAccounts());
    }
    const subscribed = state.removeAddresses(addresses || state.getAddresses());
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeListener('notification', onTransaction);
        state.removeSubscription('notification');
        return socket.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};

const unsubscribe = async (request: Request<MessageTypes.Unsubscribe>) => {
    const { payload } = request;

    let response: { subscribed: boolean };
    if (payload.type === 'accounts') {
        response = await unsubscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        response = await unsubscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        response = await unsubscribeBlock(request);
    } else {
        throw new CustomError('invalid_param', '+type');
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: response,
    } as const;
};

const onRequest = (request: Request<Message>) => {
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

    async connect(): Promise<BlockfrostAPI> {
        if (this.api && this.api.isConnected()) return this.api;

        const { timeout, pingTimeout, keepAlive } = this.settings;
        this.validateEndpoints();

        this.debug('Connecting to', this.endpoints[0]);

        const api = new BlockfrostAPI({
            url: this.endpoints[0],
            timeout,
            pingTimeout,
            keepAlive,
            agent: this.proxyAgent,
        });

        try {
            await api.connect();
            this.api = api;
        } catch (error) {
            this.debug('Websocket connection failed', error);
            this.api = undefined;
            // connection error. remove endpoint
            this.endpoints.splice(0, 1);
            // and try another one or throw error
            if (this.endpoints.length < 1) {
                throw new CustomError('connect', 'All backends are down');
            }
            return this.connect();
        }

        api.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({
            id: -1,
            type: RESPONSES.CONNECTED,
        });

        this.debug('Connected');
        return api;
    }

    disconnect() {
        if (this.api) {
            this.api.disconnect();
        }
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
