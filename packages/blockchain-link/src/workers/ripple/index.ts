import { RippleAPI } from 'ripple-lib';
import BigNumber from 'bignumber.js';
import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';

import * as MessageTypes from '../../types/messages';
import { Message, Response, SubscriptionAccountInfo, AccountInfo } from '../../types';
import * as utils from './utils';
import WorkerCommon from '../common';

declare function postMessage(data: Response): void;

const common = new WorkerCommon(postMessage);

let rippleApi: RippleAPI | undefined;
let pingTimeout: ReturnType<typeof setTimeout>;

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 3 * 60 * 1000;

let endpoints: string[] = [];
const RESERVE = {
    BASE: '10000000',
    OWNER: '2000000',
};

const setPingTimeout = () => {
    if (pingTimeout) {
        clearTimeout(pingTimeout);
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    pingTimeout = setTimeout(onPing, common.getSettings().pingTimeout || DEFAULT_PING_TIMEOUT);
};

const onPing = async () => {
    if (rippleApi && rippleApi.isConnected()) {
        if (common.hasSubscriptions() || common.getSettings().keepAlive) {
            try {
                await rippleApi.getServerInfo();
            } catch (error) {
                common.debug(`Error in timeout ping request: ${error}`);
            }
            // reset timeout
            setPingTimeout();
        } else {
            rippleApi.disconnect();
        }
    }
};

const cleanup = () => {
    if (pingTimeout) {
        clearTimeout(pingTimeout);
    }
    if (rippleApi) {
        rippleApi.removeAllListeners();
        rippleApi = undefined;
    }
    endpoints = [];
    common.removeAddresses(common.getAddresses());
    common.clearSubscriptions();
};

const connect = async (): Promise<RippleAPI> => {
    if (rippleApi) {
        // socket is already connected
        if (rippleApi.isConnected()) return rippleApi;
    }
    // validate endpoints
    const { server, timeout } = common.getSettings();
    if (!server || !Array.isArray(server) || server.length < 1) {
        throw new CustomError('connect', 'Endpoint not set');
    }

    if (endpoints.length < 1) {
        endpoints = common.shuffleEndpoints(server.slice(0));
    }

    common.debug('Connecting to', endpoints[0]);
    let api: RippleAPI;

    try {
        api = new RippleAPI({
            server: endpoints[0],
            timeout: timeout || DEFAULT_TIMEOUT,
        });
        // disable websocket auto reconnecting
        // workaround for RippleApi which doesn't have possibility to disable reconnection
        // issue: https://github.com/ripple/ripple-lib/issues/1068
        // override Api (connection) private methods and return never ending promises to prevent this behavior
        api.connection.reconnect = () => new Promise(() => {});
        await api.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        rippleApi = undefined;
        // connection error. remove endpoint
        endpoints.splice(0, 1);
        // and try another one or throw error
        if (endpoints.length < 1) {
            throw new CustomError('connect', 'All backends are down');
        }
        return connect();
    }

    // Ripple api does set ledger listener automatically
    api.on('ledger', ledger => {
        // store current ledger values
        RESERVE.BASE = api.xrpToDrops(ledger.reserveBaseXRP);
        RESERVE.OWNER = api.xrpToDrops(ledger.reserveIncrementXRP);
    });

    api.on('disconnected', () => {
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
        cleanup();
    });

    common.response({ id: -1, type: RESPONSES.CONNECTED });

    rippleApi = api;
    return rippleApi;
};

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const api = await connect();
        const info = await api.getServerInfo();

        // store current ledger values
        RESERVE.BASE = api.xrpToDrops(info.validatedLedger.reserveBaseXRP);
        RESERVE.OWNER = api.xrpToDrops(info.validatedLedger.reserveIncrementXRP);

        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: {
                url: api.connection.getUrl(),
                ...utils.transformServerInfo(info),
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    } finally {
        // reset timeout
        setPingTimeout();
    }
};

// Custom request
// Ripple js api doesn't support "ledger_index": "current", which will fetch data from mempool
const getMempoolAccountInfo = async (
    account: string
): Promise<{ xrpBalance: string; sequence: number; txs: number }> => {
    const api = await connect();
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
    // eslint-disable-next-line camelcase
    ledger_index_max: number;
    limit: number;
    transactions: any[];
}
const getRawTransactionsData = async (options: any): Promise<RawTxData> => {
    const api = await connect();
    return api.request('account_tx', options);
};

const getAccountInfo = async (
    data: MessageTypes.GetAccountInfo & { id: number }
): Promise<void> => {
    const { payload } = data;

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
        const api = await connect();

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
        if (error.data && error.data.error === 'actNotFound') {
            common.response({
                id: data.id,
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: account,
            });
        } else {
            common.errorHandler({ id: data.id, error: utils.transformError(error) });
        }
        return;
    }

    // get mempool information
    try {
        const mempoolInfo = await getMempoolAccountInfo(payload.descriptor);
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

    // get the reserve
    if (payload.details !== 'txs') {
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        });
        return;
    }

    try {
        const requestOptions = {
            account: payload.descriptor,
            ledger_index_min: payload.from ? payload.from : undefined,
            ledger_index_max: payload.to ? payload.to : undefined,
            limit: payload.pageSize || 25,
            marker: payload.marker,
        };

        const transactionsData = await getRawTransactionsData(requestOptions);
        account.history.transactions = transactionsData.transactions.map(raw =>
            utils.transformTransaction(payload.descriptor, raw.tx)
        );

        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: {
                ...account,
                marker: transactionsData.marker,
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    }
};

const getTransaction = async (
    data: { id: number } & MessageTypes.GetTransaction
): Promise<void> => {
    const { payload } = data;
    try {
        const api = await connect();
        const tx = await api.getTransaction(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_TRANSACTION,
            payload: {
                type: 'ripple',
                tx,
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    } finally {
        // reset timeout
        setPingTimeout();
    }
};

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        const api = await connect();
        const fee = await api.getFee();
        // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 12 drops to 6000+ drops for a moment
        // investigate more...
        let drops = api.xrpToDrops(fee);
        if (new BigNumber(drops).gt('2000')) {
            drops = '12';
        }
        const payload =
            data.payload && Array.isArray(data.payload.blocks)
                ? data.payload.blocks.map(() => ({ feePerUnit: drops }))
                : [{ feePerUnit: drops }];
        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    } finally {
        // reset timeout
        setPingTimeout();
    }
};

const pushTransaction = async (
    data: { id: number } & MessageTypes.PushTransaction
): Promise<void> => {
    try {
        const api = await connect();
        // tx_blob hex must be in upper case
        const info = await api.submit(data.payload.toUpperCase());

        if (info.resultCode === 'tesSUCCESS') {
            common.response({
                id: data.id,
                type: RESPONSES.PUSH_TRANSACTION,
                // payload: info.resultMessage,
                // @ts-ignore: TODO: this param is not typed in RippleApi
                payload: info.tx_json.hash,
            });
        } else {
            common.errorHandler({ id: data.id, error: { message: info.resultMessage } });
            return;
        }
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    } finally {
        // reset timeout
        setPingTimeout();
    }
};

const onNewBlock = (event: any) => {
    // reset timeout
    setPingTimeout();

    common.response({
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

const onTransaction = (event: any) => {
    // reset timeout
    setPingTimeout();
    if (event.type !== 'transaction') return;
    // ignore transactions other than Payment
    const tx = event.transaction;
    if (event.transaction.TransactionType !== 'Payment') return;

    const notify = (descriptor: string) => {
        common.response({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    descriptor,
                    tx: utils.transformTransaction(descriptor, { ...event, ...tx }),
                },
            },
        });
    };

    const subscribed = common.getAddresses();
    const sent = subscribed.find(a => a === tx.Account);
    if (sent) notify(sent);
    const recv = subscribed.find(a => a === tx.Destination);
    if (recv) notify(recv);
};

const subscribeAccounts = async (accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await connect();
    const prevAddresses = common.getAddresses();
    common.addAccounts(accounts);
    const uniqueAddresses = common.getAddresses().filter(a => prevAddresses.indexOf(a) < 0);
    if (uniqueAddresses.length > 0) {
        if (!common.getSubscription('notification')) {
            api.connection.on('transaction', onTransaction);
            common.addSubscription('notification');
        }
        await api.request('subscribe', {
            accounts_proposed: uniqueAddresses,
        });
    }
    return { subscribed: common.getAddresses().length > 0 };
};

const subscribeAddresses = async (addresses: string[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await connect();
    const uniqueAddresses = common.addAddresses(addresses);

    if (uniqueAddresses.length > 0) {
        if (!common.getSubscription('transaction')) {
            api.connection.on('transaction', onTransaction);
            // api.connection.on('ledgerClosed', onLedgerClosed);
            common.addSubscription('transaction');
        }
        const request = {
            // accounts: uniqueAddresses,
            accounts_proposed: uniqueAddresses,
            // stream: ['transactions', 'transactions_proposed'],
            // accounts_proposed: mempool ? uniqueAddresses : [],
        };

        await api.request('subscribe', request);
    }
    return { subscribed: common.getAddresses().length > 0 };
};

const subscribeBlock = async () => {
    if (!common.getSubscription('ledger')) {
        const api = await connect();
        api.on('ledger', onNewBlock);
        common.addSubscription('ledger');
    }
    return { subscribed: true };
};

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;
    try {
        let response;
        if (payload.type === 'accounts') {
            response = await subscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            response = await subscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            response = await subscribeBlock();
        } else {
            throw new CustomError('invalid_param', '+type');
        }
        common.response({
            id: data.id,
            type: RESPONSES.SUBSCRIBE,
            payload: response,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    } finally {
        // reset timeout
        setPingTimeout();
    }
};

const unsubscribeAddresses = async (addresses?: string[]) => {
    // remove accounts
    const api = await connect();
    if (!addresses) {
        const all = common.getAddresses();
        common.removeAccounts(common.getAccounts());
        common.removeAddresses(all);
        await api.request('unsubscribe', {
            accounts_proposed: all,
        });
    } else {
        common.removeAddresses(addresses);
        await api.request('unsubscribe', {
            accounts_proposed: addresses,
        });
    }
    if (common.getAccounts().length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.connection.removeListener('transaction', onTransaction);
        // api.connection.off('ledgerClosed', onLedgerClosed);
        common.removeSubscription('transaction');
    }
};

const unsubscribeAccounts = async (accounts?: SubscriptionAccountInfo[]) => {
    const prevAddresses = common.getAddresses();
    common.removeAccounts(accounts || common.getAccounts());
    const addresses = common.getAddresses();
    const uniqueAddresses = prevAddresses.filter(a => addresses.indexOf(a) < 0);
    await unsubscribeAddresses(uniqueAddresses);
};

const unsubscribeBlock = async () => {
    if (!common.getSubscription('ledger')) return;
    const api = await connect();
    api.removeListener('ledger', onNewBlock);
    common.removeSubscription('ledger');
};

const unsubscribe = async (data: { id: number } & MessageTypes.Unsubscribe): Promise<void> => {
    const { payload } = data;
    try {
        if (payload.type === 'accounts') {
            await unsubscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            await unsubscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            await unsubscribeBlock();
        }
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
        return;
    } finally {
        // reset timeout
        setPingTimeout();
    }

    common.response({
        id: data.id,
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: common.getAddresses().length > 0 },
    });
};

const disconnect = async (data: { id: number }) => {
    if (!rippleApi) {
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
        return;
    }
    try {
        await rippleApi.disconnect();
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
    } catch (error) {
        common.errorHandler({ id: data.id, error: utils.transformError(error) });
    }
};

// WebWorker message handling
onmessage = (event: { data: Message }) => {
    if (!event.data) return;
    const { data } = event;

    common.debug('onmessage', data);
    switch (data.type) {
        case MESSAGES.HANDSHAKE:
            common.setSettings(data.settings);
            break;
        case MESSAGES.CONNECT:
            connect()
                .then(() => {
                    common.response({ id: data.id, type: RESPONSES.CONNECT, payload: true });
                })
                .catch(error =>
                    common.errorHandler({ id: data.id, error: utils.transformError(error) })
                );
            break;
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
            break;
        case MESSAGES.GET_TRANSACTION:
            getTransaction(data);
            break;
        case MESSAGES.ESTIMATE_FEE:
            estimateFee(data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(data);
            break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        case MESSAGES.UNSUBSCRIBE:
            unsubscribe(data);
            break;
        case MESSAGES.DISCONNECT:
            disconnect(data);
            break;
        // @ts-ignore this message is used in tests
        case 'terminate':
            cleanup();
            break;
        default:
            common.errorHandler({
                id: data.id,
                error: new CustomError('worker_unknown_request', `+${data.type}`),
            });
            break;
    }
};

// Handshake to host
common.handshake();
