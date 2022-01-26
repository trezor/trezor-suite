import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import { BaseWorker, CONTEXT, ContextType } from '../base';
import { BlockbookAPI } from './websocket';
import * as utils from './utils';
import type { Message, Response, SubscriptionAccountInfo } from '../../types';
import type {
    AddressNotification,
    BlockNotification,
    FiatRatesNotification,
} from '../../types/blockbook';
import type * as MessageTypes from '../../types/messages';

type Context = ContextType<BlockbookAPI>;
type Request<T> = T & Context;

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const info = await api.getServerInfo();
    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.options.url,
            ...utils.transformServerInfo(info),
        },
    } as const;
};

const getBlockHash = async (request: Request<MessageTypes.GetBlockHash>) => {
    const api = await request.connect();
    const info = await api.getBlockHash(request.payload);
    return {
        type: RESPONSES.GET_BLOCK_HASH,
        payload: info.hash,
    } as const;
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const api = await request.connect();
    const info = await api.getAccountInfo(payload);
    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: utils.transformAccountInfo(info),
    } as const;
};

const getAccountUtxo = async (request: Request<MessageTypes.GetAccountUtxo>) => {
    const { payload } = request;
    const api = await request.connect();
    const utxos = await api.getAccountUtxo(payload);
    return {
        type: RESPONSES.GET_ACCOUNT_UTXO,
        payload: utils.transformAccountUtxo(utxos),
    } as const;
};

const getAccountBalanceHistory = async (
    request: Request<MessageTypes.GetAccountBalanceHistory>
) => {
    const { payload } = request;
    const api = await request.connect();
    const history = await api.getAccountBalanceHistory(payload);
    return {
        type: RESPONSES.GET_ACCOUNT_BALANCE_HISTORY,
        payload: history,
    } as const;
};

const getCurrentFiatRates = async (request: Request<MessageTypes.GetCurrentFiatRates>) => {
    const { payload } = request;
    const api = await request.connect();
    const fiatRates = await api.getCurrentFiatRates(payload);
    return {
        type: RESPONSES.GET_CURRENT_FIAT_RATES,
        payload: fiatRates,
    } as const;
};

const getFiatRatesForTimestamps = async (
    request: Request<MessageTypes.GetFiatRatesForTimestamps>
) => {
    const { payload } = request;
    const api = await request.connect();
    const { tickers } = await api.getFiatRatesForTimestamps(payload);
    return {
        type: RESPONSES.GET_FIAT_RATES_FOR_TIMESTAMPS,
        payload: { tickers },
    } as const;
};

const getFiatRatesTickersList = async (request: Request<MessageTypes.GetFiatRatesTickersList>) => {
    const { payload } = request;
    const api = await request.connect();
    const tickers = await api.getFiatRatesTickersList(payload);
    return {
        type: RESPONSES.GET_FIAT_RATES_TICKERS_LIST,
        payload: {
            ts: tickers.ts,
            availableCurrencies: tickers.available_currencies, // convert to camelCase
        },
    } as const;
};

const getTransaction = async (request: Request<MessageTypes.GetTransaction>) => {
    const api = await request.connect();
    const tx = await api.getTransaction(request.payload);
    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: {
            type: 'blockbook',
            tx,
        },
    } as const;
};

const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const api = await request.connect();
    const resp = await api.pushTransaction(request.payload);
    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: resp.result,
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const resp = await api.estimateFee(request.payload);
    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload: resp,
    } as const;
};

const onNewBlock = ({ post }: Context, event: BlockNotification) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height,
                blockHash: event.hash,
            },
        },
    });
};

const onTransaction = ({ state, post }: Context, event: AddressNotification) => {
    if (!event.tx) return;
    const descriptor = event.address;
    // check if there is subscribed account with received address
    const account = state.getAccount(descriptor);
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? utils.transformTransaction(account.descriptor, account.addresses, event.tx)
                    : utils.transformTransaction(descriptor, undefined, event.tx),
            },
        },
    });
};

const onNewFiatRates = ({ post }: Context, event: FiatRatesNotification) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'fiatRates',
            payload: {
                rates: event.rates,
            },
        },
    });
};

const subscribeAccounts = async (ctx: Context, accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
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
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    state.addAddresses(addresses);
    if (!state.getSubscription('notification')) {
        api.on('notification', ev => onTransaction(ctx, ev));
        state.addSubscription('notification');
    }
    return api.subscribeAddresses(state.getAddresses());
};

const subscribeBlock = async (ctx: Context) => {
    if (ctx.state.getSubscription('block')) return { subscribed: true };
    const api = await ctx.connect();
    ctx.state.addSubscription('block');
    api.on('block', ev => onNewBlock(ctx, ev));
    return api.subscribeBlock();
};

const subscribeFiatRates = async (ctx: Context, currency?: string) => {
    const api = await ctx.connect();
    if (!ctx.state.getSubscription('fiatRates')) {
        ctx.state.addSubscription('fiatRates');
        api.on('fiatRates', ev => onNewFiatRates(ctx, ev));
    }
    return api.subscribeFiatRates(currency);
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
    } else if (payload.type === 'fiatRates') {
        response = await subscribeFiatRates(request, payload.currency);
    } else {
        throw new CustomError('invalid_param', '+type');
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    } as const;
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
    const api = await connect();
    // remove accounts
    if (!addresses) {
        state.removeAccounts(state.getAccounts());
    }
    const subscribed = state.removeAddresses(addresses || state.getAddresses());
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

const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('block')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('block');
    state.removeSubscription('block');
    return api.unsubscribeBlock();
};

const unsubscribeFiatRates = async ({ state, connect }: Context) => {
    if (!state.getSubscription('fiatRates')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('fiatRates');
    state.removeSubscription('fiatRates');
    return api.unsubscribeFiatRates();
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
    } else if (payload.type === 'fiatRates') {
        response = await unsubscribeFiatRates(request);
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
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_ACCOUNT_UTXO:
            return getAccountUtxo(request);
        case MESSAGES.GET_TRANSACTION:
            return getTransaction(request);
        case MESSAGES.GET_ACCOUNT_BALANCE_HISTORY:
            return getAccountBalanceHistory(request);
        case MESSAGES.GET_CURRENT_FIAT_RATES:
            return getCurrentFiatRates(request);
        case MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS:
            return getFiatRatesForTimestamps(request);
        case MESSAGES.GET_FIAT_RATES_TICKERS_LIST:
            return getFiatRatesTickersList(request);
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

class BlockbookWorker extends BaseWorker<BlockbookAPI> {
    cleanup() {
        if (this.api) {
            this.api.dispose();
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    async connect(): Promise<BlockbookAPI> {
        if (this.api && this.api.isConnected()) return this.api;

        const { timeout, pingTimeout, keepAlive } = this.settings;
        this.validateEndpoints();

        this.debug('Connecting to', this.endpoints[0]);

        const api = new BlockbookAPI({
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
export default function Blockbook() {
    return new BlockbookWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new BlockbookWorker();
    onmessage = module.messageHandler.bind(module);
}
