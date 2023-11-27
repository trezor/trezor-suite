import { RippleAPI, APIOptions } from 'ripple-lib';
import { RippleError } from 'ripple-lib/dist/npm/common/errors';
import BigNumber from 'bignumber.js';
import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { BaseWorker, CONTEXT, ContextType } from '../baseWorker';
import * as utils from '@trezor/blockchain-link-utils/lib/ripple';
import type { Response, SubscriptionAccountInfo, AccountInfo } from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/lib/messages';

type Context = ContextType<RippleAPI>;
type Request<T> = T & Context;

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 3 * 60 * 1000;
const RESERVE = {
    BASE: '10000000',
    OWNER: '2000000',
};

const transformError = (error: any) => {
    if (error instanceof RippleError) {
        const code =
            error.name === 'TimeoutError' ? 'websocket_timeout' : 'websocket_error_message';
        if (error.data) {
            return new CustomError(code, `${error.name} ${error.data.error_message}`);
        }
        return new CustomError(code, error.toString());
    }
    return error;
};

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const api = await request.connect();
    const info = await api.getServerInfo();

    // store current ledger values
    RESERVE.BASE = api.xrpToDrops(info.validatedLedger.reserveBaseXRP);
    RESERVE.OWNER = api.xrpToDrops(info.validatedLedger.reserveIncrementXRP);

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.connection.getUrl(),
            ...utils.transformServerInfo(info),
        },
    } as const;
};

// Custom request
// Ripple js api doesn't support "ledger_index": "current", which will fetch data from mempool
const getMempoolAccountInfo = async (api: RippleAPI, account: string) => {
    const info = await api.request('account_info', {
        account,
        ledger_index: 'current',
        queue: true,
    });
    return {
        xrpBalance: info.account_data.Balance,
        sequence: info.account_data.Sequence,
        txs: info.queue_data ? info.queue_data.txn_count : 0,
    };
};

// Custom request
// Ripple ja api returns parsed/formatted transactions, use own parsing
interface RawTxData {
    marker: {
        ledger: number;
        seq: number;
    };
    ledger_index_max: number;
    limit: number;
    transactions: any[];
}

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
        const api = await request.connect();
        const info = await api.getAccountInfo(payload.descriptor);
        const ownersReserve =
            info.ownerCount > 0
                ? new BigNumber(info.ownerCount).times(RESERVE.OWNER).toString()
                : '0';

        const reserve = new BigNumber(RESERVE.BASE).plus(ownersReserve).toString();
        const misc = {
            sequence: info.sequence,
            reserve,
        };
        account.misc = misc;
        account.balance = api.xrpToDrops(info.xrpBalance);
        account.availableBalance = new BigNumber(account.balance).minus(reserve).toString();
        account.empty = false;
    } catch (error) {
        // empty account throws error "actNotFound"
        // catch it and respond with empty account
        if (error instanceof RippleError && error.data && error.data.error === 'actNotFound') {
            return {
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: account,
            } as const;
        }
        throw error;
    }

    // get mempool information
    try {
        const api = await request.connect();
        const mempoolInfo = await getMempoolAccountInfo(api, payload.descriptor);
        const { misc } = account;
        const reserve: string =
            misc && typeof misc.reserve === 'string' ? misc.reserve : RESERVE.BASE;
        account.availableBalance = new BigNumber(mempoolInfo.xrpBalance).minus(reserve).toString();
        account.misc.sequence = mempoolInfo.sequence;
        account.history.unconfirmed = mempoolInfo.txs;
    } catch (error) {
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

    const requestOptions = {
        account: payload.descriptor,
        ledger_index_min: payload.from ? payload.from : undefined,
        ledger_index_max: payload.to ? payload.to : undefined,
        limit: payload.pageSize || 25,
        marker: payload.marker,
    };

    const api = await request.connect();
    const transactionsData: RawTxData = await api.request('account_tx', requestOptions);
    account.history.transactions = transactionsData.transactions.map(raw =>
        utils.transformTransaction(raw.tx, payload.descriptor),
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            marker: transactionsData.marker,
        },
    } as const;
};

const getTransaction = async ({ connect, payload }: Request<MessageTypes.GetTransaction>) => {
    const api = await connect();
    const rawtx = await api.request('tx', { transaction: payload, binary: false });
    const tx = utils.transformTransaction(rawtx);
    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: tx,
    } as const;
};

const pushTransaction = async ({ connect, payload }: Request<MessageTypes.PushTransaction>) => {
    const api = await connect();
    // tx_blob hex must be in upper case
    const info = await api.submit(payload.toUpperCase());

    if (info.resultCode === 'tesSUCCESS') {
        return {
            type: RESPONSES.PUSH_TRANSACTION,
            // payload: info.resultMessage,
            // @ts-expect-error this param is not typed in RippleApi
            payload: info.tx_json.hash,
        } as const;
    }
    throw new Error(info.resultMessage);
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const fee = await api.getFee();
    // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 12 drops to 6000+ drops for a moment
    // investigate more...
    let drops = api.xrpToDrops(fee);
    if (new BigNumber(drops).gt('2000')) {
        drops = '12';
    }
    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: drops }))
            : [{ feePerUnit: drops }];
    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const onNewBlock = ({ post }: Context, event: any) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.ledgerVersion,
                blockHash: event.ledgerHash,
            },
        },
    });
};

const onTransaction = ({ state, post }: Context, event: any) => {
    if (event.type !== 'transaction') return;
    // ignore transactions other than Payment
    const tx = event.transaction;
    if (event.transaction.TransactionType !== 'Payment') return;

    const notify = (descriptor: string) => {
        post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    descriptor,
                    tx: utils.transformTransaction({ ...event, ...tx }, descriptor),
                },
            },
        });
    };

    const subscribed = state.getAddresses();
    const sent = subscribed.find(a => a === tx.Account);
    if (sent) notify(sent);
    const recv = subscribed.find(a => a === tx.Destination);
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
            api.connection.on('transaction', ev => onTransaction(ctx, ev));
            state.addSubscription('notification');
        }
        await api.request('subscribe', {
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
            api.connection.on('transaction', ev => onTransaction(ctx, ev));
            // api.connection.on('ledgerClosed', onLedgerClosed);
            state.addSubscription('transaction');
        }
        const request = {
            // accounts: uniqueAddresses,
            accounts_proposed: uniqueAddresses,
            // stream: ['transactions', 'transactions_proposed'],
            // accounts_proposed: mempool ? uniqueAddresses : [],
        };

        await api.request('subscribe', request);
    }
    return { subscribed: state.getAddresses().length > 0 };
};

const subscribeBlock = async (ctx: Context) => {
    if (!ctx.state.getSubscription('ledger')) {
        const api = await ctx.connect();
        api.on('ledger', ev => onNewBlock(ctx, ev));
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
        await api.request('unsubscribe', {
            accounts_proposed: all,
        });
    } else {
        state.removeAddresses(addresses);
        await api.request('unsubscribe', {
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
    const api = await connect();
    api.removeAllListeners('ledger');
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

class RippleWorker extends BaseWorker<RippleAPI> {
    pingTimeout?: ReturnType<typeof setTimeout>;

    cleanup() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.api) {
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    protected isConnected(api: RippleAPI | undefined): api is RippleAPI {
        return api?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<RippleAPI> {
        const options: APIOptions = {
            server: url,
            timeout: this.settings.timeout || DEFAULT_TIMEOUT, // timeout is used for request and heartbeat (ping), see node_modules/ripple-lib/dist/npm/common/connection.js
            connectionTimeout: this.settings.timeout || DEFAULT_TIMEOUT, // connectionTimeout is used only for connection
        };
        // proxy agent is available only in suite because of the patch.
        // it will fail in standalone trezor-connect implementation where this patch is not present.
        // TODO: https://github.com/trezor/trezor-suite/issues/4942
        if (RippleAPI._ALLOW_AGENT) {
            options.agent = this.proxyAgent;
        }
        const api = new RippleAPI(options);
        // disable websocket auto reconnecting
        // workaround for RippleApi which doesn't have possibility to disable reconnection
        // issue: https://github.com/ripple/ripple-lib/issues/1068
        // override Api (connection) private methods and return never ending promises to prevent this behavior
        api.connection.reconnect = () => new Promise(() => {});
        await api.connect();

        // Ripple api does set ledger listener automatically
        api.on('ledger', ledger => {
            // store current ledger values
            RESERVE.BASE = api.xrpToDrops(ledger.reserveBaseXRP);
            RESERVE.OWNER = api.xrpToDrops(ledger.reserveIncrementXRP);
        });

        api.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({ id: -1, type: RESPONSES.CONNECTED });
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
        this.pingTimeout = setTimeout(
            () => this.onPing(),
            this.settings.pingTimeout || DEFAULT_PING_TIMEOUT,
        );
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
