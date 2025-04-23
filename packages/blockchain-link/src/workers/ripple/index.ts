import {
    Client,
    ClientOptions,
    ErrorResponse,
    LedgerStream,
    TransactionStream,
    XrplError,
    xrpToDrops,
} from 'xrpl';

import type {
    AccountInfo,
    AccountInfoParams,
    Response,
    SubscriptionAccountInfo,
} from '@trezor/blockchain-link-types';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import * as utils from '@trezor/blockchain-link-utils/src/ripple';
import { getSuiteVersion } from '@trezor/env-utils';
import { TimerId } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { BaseWorker, CONTEXT, ContextType } from '../baseWorker';

type Context = ContextType<Client>;
type Request<T> = T & Context;

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 3 * 60 * 1000;
const RESERVE = {
    BASE: '10000000',
    OWNER: '2000000',
};

const transformError = (error: unknown) => {
    if (error instanceof XrplError) {
        const code =
            error.name === 'TimeoutError' ? 'websocket_timeout' : 'websocket_error_message';
        if (error.data) {
            const errorMessageData = (error.data as { error_message: string }).error_message;
            const errorMessage = `${error.name} ${errorMessageData}`;

            return new CustomError(code, errorMessage);
        }

        return new CustomError(code, error.toString());
    }

    return error;
};

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const client = await request.connect();
    const response = await client.request({
        command: 'server_info',
    });

    // store current ledger values
    if (response.result.info.validated_ledger != null) {
        RESERVE.BASE = xrpToDrops(response.result.info.validated_ledger.reserve_base_xrp);
        RESERVE.OWNER = xrpToDrops(response.result.info.validated_ledger.reserve_inc_xrp);
    }

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: client.connection.getUrl(),
            ...utils.transformServerInfo(response),
        },
    } as const;
};

// Custom request to get account info from mempool
const getMempoolAccountInfo = async (client: Client, account: string) => {
    const response = await client.request({
        command: 'account_info',
        account,
        ledger_index: 'current',
        queue: true,
    });

    return {
        xrpBalance: response.result.account_data.Balance,
        sequence: response.result.account_data.Sequence,
        txs: response.result.queue_data ? response.result.queue_data.txn_count : 0,
    };
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;

    // initial state (basic)
    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0', // default balance
        availableBalance: '0', // default balance
        empty: true,
        // tokens: [], // XRP tokens are not implemented in Trezor firmware
        history: {
            // default history
            total: -1,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {
            // default misc
            sequence: 0,
            reserve: RESERVE.BASE,
        },
    };

    try {
        const client = await request.connect();
        const info = await client.request({
            command: 'account_info',
            account: payload.descriptor,
            ledger_index: 'validated',
        });

        const ownersReserve =
            info.result.account_data.OwnerCount > 0
                ? new BigNumber(info.result.account_data.OwnerCount).times(RESERVE.OWNER).toString()
                : '0';

        const reserve = new BigNumber(RESERVE.BASE).plus(ownersReserve).toString();
        const misc = {
            sequence: info.result.account_data.Sequence,
            reserve,
        };
        account.misc = misc;
        account.balance = info.result.account_data.Balance;
        account.availableBalance = new BigNumber(account.balance).minus(reserve).toString();
        account.empty = false;
    } catch (error: unknown) {
        // empty account throws error "actNotFound"
        // catch it and respond with empty account
        if (error instanceof XrplError && (error.data as ErrorResponse)?.error === 'actNotFound') {
            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: account,
            } as const;
        }

        throw error;
    }

    // get mempool information
    try {
        const client = await request.connect();
        const mempoolInfo = await getMempoolAccountInfo(client, payload.descriptor);
        const { misc } = account;
        const reserve: string =
            misc && typeof misc.reserve === 'string' ? misc.reserve : RESERVE.BASE;
        account.availableBalance = new BigNumber(mempoolInfo.xrpBalance).minus(reserve).toString();
        account.misc.sequence = mempoolInfo.sequence;
        account.history.unconfirmed = mempoolInfo.txs;
    } catch {
        // do not throw error for mempool (ledger_index: "current")
        // mainnet sometimes return "error": "noNetwork", "error_message": "InsufficientNetworkMode",
        // TODO: investigate
    }

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    const client = await request.connect();
    const response = await client.request({
        command: 'account_tx',
        account: payload.descriptor,
        ledger_index_min: payload.from ? payload.from : undefined,
        ledger_index_max: payload.to ? payload.to : undefined,
        limit: payload.pageSize || 25,
        marker: payload.marker,
        api_version: 2,
    });

    account.history.transactions = response.result.transactions.flatMap(raw =>
        raw.tx_json != null
            ? [utils.transformTransaction(raw.hash, raw.tx_json, raw.meta, payload.descriptor)]
            : [],
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            marker: response.result.marker as AccountInfoParams['marker'],
        },
    } as const;
};

const getTransaction = async ({ connect, payload }: Request<MessageTypes.GetTransaction>) => {
    const client = await connect();
    const rawTx = await client.request({
        command: 'tx',
        transaction: payload,
        binary: false,
    });

    const tx = utils.transformTransaction(
        rawTx.result.hash,
        rawTx.result.tx_json,
        rawTx.result.meta,
    );

    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: tx,
    } as const;
};

const pushTransaction = async ({ connect, payload }: Request<MessageTypes.PushTransaction>) => {
    const client = await connect();
    // tx_blob hex must be in upper case
    const info = await client.submit(payload.toUpperCase());

    if (info.result.engine_result === 'tesSUCCESS' && info.result.tx_json.hash) {
        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: info.result.tx_json.hash,
        } as const;
    }
    throw new Error(info.result.engine_result_message);
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const client = await request.connect();
    const fee = await client.request({
        command: 'fee',
    });

    // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 10 drops to 6000+ drops for a moment
    // investigate more...

    const drops = fee.result.drops.base_fee;

    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: drops }))
            : [{ feePerUnit: drops }];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const onNewBlock = ({ post }: Context, event: LedgerStream) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.ledger_index,
                blockHash: event.ledger_hash,
            },
        },
    });
};

const onTransaction = ({ state, post }: Context, event: TransactionStream) => {
    if (event.type !== 'transaction') return;
    // ignore transactions other than Payment
    if (event.tx_json?.TransactionType !== 'Payment') return;

    const { tx_json, hash } = event;

    const notify = (descriptor: string) => {
        if (!tx_json || !hash) return;

        post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    descriptor,
                    tx: utils.transformTransaction(hash, tx_json, undefined, descriptor),
                },
            },
        });
    };

    const subscribed = state.getAddresses();
    const sent = subscribed.find(a => a === tx_json.Account);
    if (sent) notify(sent);

    const recv = subscribed.find(a => a === tx_json.Destination);
    if (recv) notify(recv);
};

const subscribeAccounts = async (ctx: Context, accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    const prevAddresses = state.getAddresses();
    state.addAccounts(accounts);
    const uniqueAddresses = state.getAddresses().filter(a => prevAddresses.indexOf(a) < 0);
    if (uniqueAddresses.length > 0) {
        if (!state.getSubscription('notification')) {
            api.on('transaction', ev => onTransaction(ctx, ev));
            state.addSubscription('notification');
        }
        await api.request({
            command: 'subscribe',
            accounts_proposed: uniqueAddresses,
        });
    }

    return { subscribed: state.getAddresses().length > 0 };
};

const subscribeAddresses = async (ctx: Context, addresses: string[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    const uniqueAddresses = state.addAddresses(addresses);

    if (uniqueAddresses.length > 0) {
        if (!state.getSubscription('transaction')) {
            api.on('transaction', ev => onTransaction(ctx, ev));
            state.addSubscription('transaction');
        }

        await api.request({
            command: 'subscribe',
            accounts_proposed: uniqueAddresses,
        });
    }

    return { subscribed: state.getAddresses().length > 0 };
};

const subscribeBlock = async (ctx: Context) => {
    if (!ctx.state.getSubscription('ledger')) {
        const api = await ctx.connect();
        api.on('ledgerClosed', ev => onNewBlock(ctx, ev));
        ctx.state.addSubscription('ledger');
    }

    return { subscribed: true };
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

const unsubscribeAddresses = async ({ state, connect }: Context, addresses?: string[]) => {
    // remove accounts
    const api = await connect();
    if (!addresses) {
        const all = state.getAddresses();
        state.removeAccounts(state.getAccounts());
        state.removeAddresses(all);
        await api.request({
            command: 'unsubscribe',
            accounts_proposed: all,
        });
    } else {
        state.removeAddresses(addresses);
        await api.request({
            command: 'unsubscribe',
            accounts_proposed: addresses,
        });
    }
    if (state.getAccounts().length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.connection.removeAllListeners('transaction');
        // api.connection.off('ledgerClosed', onLedgerClosed);
        state.removeSubscription('transaction');
    }
};

const unsubscribeAccounts = async (ctx: Context, accounts?: SubscriptionAccountInfo[]) => {
    const { state } = ctx;
    const prevAddresses = state.getAddresses();
    state.removeAccounts(accounts || state.getAccounts());
    const addresses = state.getAddresses();
    const uniqueAddresses = prevAddresses.filter(a => addresses.indexOf(a) < 0);
    await unsubscribeAddresses(ctx, uniqueAddresses);
};

const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('ledger')) return;
    const client = await connect();
    client.removeAllListeners('ledgerClosed');
    state.removeSubscription('ledger');
};

const unsubscribe = async (request: Request<MessageTypes.Unsubscribe>) => {
    const { payload } = request;

    if (payload.type === 'accounts') {
        await unsubscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        await unsubscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        await unsubscribeBlock(request);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: request.state.getAddresses().length > 0 },
    } as const;
};

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
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

class RippleWorker extends BaseWorker<Client> {
    pingTimeout?: TimerId;

    cleanup() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.api) {
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    protected isConnected(client: Client | undefined): client is Client {
        return client?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<Client> {
        const options: ClientOptions = {
            headers: {
                'User-Agent': `Trezor Suite ${getSuiteVersion()}`,
            },
            timeout: this.settings.timeout || DEFAULT_TIMEOUT, // timeout is used for request and heartbeat (ping)
            connectionTimeout: this.settings.timeout || DEFAULT_TIMEOUT, // connectionTimeout is used only for connection
            ...(this.proxyAgent && { agent: this.proxyAgent }),
        };

        const client = new Client(url, options);
        await client.connect();

        // xrpl API automatically sets a ledger listener
        client.on('ledgerClosed', ledger => {
            // store current ledger values
            RESERVE.BASE = ledger.reserve_base.toString();
            RESERVE.OWNER = ledger.reserve_inc.toString();
        });

        client.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({ id: -1, type: RESPONSES.CONNECTED });

        client.request({
            command: 'subscribe',
            streams: ['ledger'],
        });

        return client;
    }

    disconnect() {
        return this.api?.disconnect();
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
        } catch (error: unknown) {
            this.errorResponse(event.data.id, transformError(error));
        } finally {
            if (event.data.type !== MESSAGES.DISCONNECT) {
                // reset timeout
                this.setPingTimeout();
            }
        }
    }

    setPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = this.api?.isConnected()
            ? setTimeout(() => this.onPing(), this.settings.pingTimeout || DEFAULT_PING_TIMEOUT)
            : undefined;
    }

    async onPing() {
        if (!this.api || !this.api.isConnected()) return;

        if (this.state.hasSubscriptions() || this.settings.keepAlive) {
            try {
                await this.api.getServerInfo();
            } catch (error) {
                this.debug(`Error in timeout ping request: ${error}`);
            }
            // reset timeout
            this.setPingTimeout();
        } else {
            this.api.disconnect();
        }
    }
}

// export worker factory used in src/index
export default function Ripple() {
    return new RippleWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new RippleWorker();
    onmessage = module.messageHandler.bind(module);
}
