import { RippleAPI } from 'ripple-lib';
import BigNumber from 'bignumber.js';
import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';

import * as MessageTypes from '../../types/messages';
import { Message, SubscriptionAccountInfo, AccountInfo } from '../../types';
import * as utils from './utils';
import * as common from '../common';

// declare function onmessage(event: { data: Message }): void;

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
                .then(async () => {
                    common.response({ id: data.id, type: RESPONSES.CONNECT, payload: true });
                })
                .catch(error => common.errorHandler({ id: data.id, error }));
            break;
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
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
        // case 'terminate':
        //     cleanup();
        //     break;
        default:
            common.errorHandler({
                id: data.id,
                error: new Error(`Unknown message type ${data.type}`),
            });
            break;
    }
};

let _api: RippleAPI | undefined;
let _pingTimeout: number;
let _endpoints: string[] = [];
const RESERVE = {
    BASE: '20000000',
    OWNER: '5000000',
};
const BLOCKS = {
    MIN: 0,
    MAX: 0,
};

const timeoutHandler = async () => {
    if (_api && _api.isConnected()) {
        try {
            await _api.getServerInfo();
            _pingTimeout = <any>setTimeout(timeoutHandler, 5000);
        } catch (error) {
            common.debug(`Error in timeout ping request: ${error}`);
        }
    }
};

const connect = async (): Promise<RippleAPI> => {
    if (_api) {
        // socket is already connected
        if (_api.isConnected()) return _api;
    }

    // validate endpoints
    const { server } = common.getSettings();
    if (!server || !Array.isArray(server) || server.length < 1) {
        throw new CustomError('connect', 'Endpoint not set');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.shuffleEndpoints(server.slice(0));
    }

    common.debug('Connecting to', _endpoints[0]);
    let api: RippleAPI;
    try {
        api = new RippleAPI({ server: _endpoints[0] });
        await api.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        _api = undefined;
        // connection error. remove endpoint
        _endpoints.splice(0, 1);
        // and try another one or throw error
        if (_endpoints.length < 1) {
            throw new CustomError('connect', 'All backends are down');
        }
        return await connect();
    }

    // disable reconnecting
    // workaround: RippleApi which doesn't have possibility to disable reconnection
    // override private method and return never ending promise
    api.connection._retryConnect = () => new Promise(() => {});

    api.on('ledger', ledger => {
        clearTimeout(_pingTimeout);
        _pingTimeout = <any>setTimeout(timeoutHandler, 5000);

        // store current block/ledger values
        RESERVE.BASE = api.xrpToDrops(ledger.reserveBaseXRP);
        RESERVE.OWNER = api.xrpToDrops(ledger.reserveIncrementXRP);
        const availableBlocks = ledger.validatedLedgerVersions.split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0], 10);
        BLOCKS.MAX = parseInt(availableBlocks[1], 10);
    });

    api.on('disconnected', () => {
        cleanup();
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
    });

    // mocking
    // setTimeout(() => {
    //     api.connection._ws._ws.close()
    // }, 6000);

    try {
        // @ts-ignore
        const availableBlocks = api.connection._availableLedgerVersions.serialize().split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0], 10);
        BLOCKS.MAX = parseInt(availableBlocks[1], 10);
    } catch (error) {
        const info = await api.getServerInfo();
        const availableBlocks = info.completeLedgers.split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0], 10);
        BLOCKS.MAX = parseInt(availableBlocks[1], 10);
    }

    common.response({ id: -1, type: RESPONSES.CONNECTED });

    _api = api;
    return _api;
};

const cleanup = () => {
    if (_pingTimeout) {
        clearTimeout(_pingTimeout);
    }
    if (_api) {
        _api.removeAllListeners();
        _api = undefined;
    }
    _endpoints = [];
    common.removeAddresses(common.getAddresses());
    common.clearSubscriptions();
};

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const api = await connect();
        const info = await api.getServerInfo();
        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: utils.transformServerInfo(info),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

// Custom request
// Ripple js api doesn't support "ledger_index": "current", which will fetch data from mempool
const getMempoolAccountInfo = async (
    account: string
): Promise<{ xrpBalance: string; sequence: number }> => {
    const api = await connect();
    const info = await api.request('account_info', {
        account,
        ledger_index: 'current',
        queue: true,
    });
    return {
        xrpBalance: info.account_data.Balance,
        sequence: info.account_data.Sequence,
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
    descriptor: string;
    transactions: any[];
}
const getRawTransactionsData = async (options: any): Promise<RawTxData> => {
    const api = await connect();
    return await api.request('account_tx', options);
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
        tokens: [], // not implemented in Trezor firmware
        history: {
            // default history
            total: 0,
            tokens: 0,
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
                ? new BigNumber(info.ownerCount).multipliedBy(RESERVE.OWNER).toString()
                : '0';

        const reserve = new BigNumber(RESERVE.BASE).plus(ownersReserve).toString();
        const misc = {
            sequence: info.sequence,
            reserve,
        };
        account.misc = misc;
        account.balance = api.xrpToDrops(info.xrpBalance);
        account.availableBalance = new BigNumber(account.balance).minus(reserve).toString();
    } catch (error) {
        // empty account throws error "actNotFound"
        // catch it and respond with empty account
        if (error.data.error === 'actNotFound') {
            common.response({
                id: data.id,
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: account,
            });
        } else {
            common.errorHandler({ id: data.id, error });
        }
        return;
    }

    try {
        const mempoolInfo = await getMempoolAccountInfo(payload.descriptor);
        account.availableBalance = mempoolInfo.xrpBalance; // TODO: balance - reserve
        account.misc.sequence = mempoolInfo.sequence;
    } catch (error) {
        common.errorHandler({ id: data.id, error });
        return;
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
        // Rippled has an issue with looking up outside of range of completed ledgers
        // https://github.com/ripple/ripple-lib/issues/879#issuecomment-377576063
        // Always use "minLedgerVersion"

        const requestOptions = {
            account: payload.descriptor,
            ledger_index_min: payload.from ? Math.max(payload.from, BLOCKS.MIN) : BLOCKS.MIN,
            ledger_index_max: payload.to ? Math.max(payload.to, BLOCKS.MAX) : undefined,
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
        common.errorHandler({ id: data.id, error });
    }
};

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        // const api = await connect();
        // const fee = await api.getFee();
        // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 12 drops to 6000+ drops for a moment
        // investigate more...
        // const drops = api.xrpToDrops(fee);
        // const payload =
        //     data.payload && Array.isArray(data.payload.levels)
        //         ? data.payload.levels.map(l => ({ name: l.name, value: drops }))
        //         : [{ name: 'Normal', value: drops }];
        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload: [],
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
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
                payload: info.resultMessage,
            });
        } else {
            common.errorHandler({ id: data.id, error: new Error(info.resultMessage) });
            return;
        }
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
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
        common.errorHandler({ id: data.id, error });
    }
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
        common.errorHandler({ id: data.id, error });
        return;
    }

    common.response({
        id: data.id,
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: common.getAddresses().length > 0 },
    });
};

const unsubscribeAccounts = async (accounts?: SubscriptionAccountInfo[]) => {
    const prevAddresses = common.getAddresses();
    common.removeAccounts(accounts || common.getAccounts());
    const addresses = common.getAddresses();
    const uniqueAddresses = prevAddresses.filter(a => addresses.indexOf(a) < 0);
    await unsubscribeAddresses(uniqueAddresses);
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

const unsubscribeBlock = async () => {
    if (!common.getSubscription('ledger')) return;
    const api = await connect();
    api.removeListener('ledger', onNewBlock);
    common.removeSubscription('ledger');
};

const disconnect = async (data: { id: number }) => {
    if (!_api) {
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
        return;
    }
    try {
        await _api.disconnect();
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const onNewBlock = (event: any) => {
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
    if (event.type !== 'transaction') return;
    // ignore transactions other than Payment
    const tx = event.transaction;
    if (event.transaction.TransactionType !== 'Payment') return;

    const subscribed = common.getAddresses();
    const descriptor =
        subscribed.find(a => a === tx.Account) ||
        subscribed.find(a => a === tx.Destination) ||
        'unknown';

    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor,
                tx: utils.transformTransaction(descriptor, event.transaction),
            },
        },
    });
};

common.handshake();

// // Testnet account
// // addr: rGz6kFcejym5ZEWnzUCwPjxcfwEPRUPXXG
// // secret: ss2BKjSc4sMdVXcTHxzjyQS2vyhrQ

// // Trezor account
// // rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H

// rpNqAwVKdyWxZoHerUzDfgEEobNQPnQgPU

// rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy - exachnge

// rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV - exchange2

// from: https://i.redd.it/zwcthelefj901.png
