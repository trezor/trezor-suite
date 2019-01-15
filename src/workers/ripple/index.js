/* @flow */

import { RippleAPI } from 'ripple-lib';
import BigNumber from 'bignumber.js';
import { MESSAGES, RESPONSES } from '../../constants';
import * as common from '../common';
import * as utils from './utils';

import type { Message } from '../../types';
import * as MessageTypes from '../../types/messages';
import * as ResponseTypes from '../../types/responses';

declare function onmessage(event: { data: Message }): void;

// WebWorker message handling
onmessage = (event) => {
    if (!event.data) return;
    const { data } = event;
    
    common.debug('onmessage', data);
    switch (data.type) {
        case MESSAGES.HANDSHAKE:
            common.setSettings(data.settings);
            break;
        case MESSAGES.CONNECT:
            connect().then(async (api) => {
                const block = await api.connection.getLedgerVersion();
                common.response({ id: data.id, type: RESPONSES.CONNECT, payload: true });
            }).catch(error => common.errorHandler({ id: data.id, error }));
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
        default:
            common.errorHandler({
                id: data.id,
                error: new Error(`Unknown message type ${data.type}`)
            });
            break;
    }
};

let _api: ?RippleAPI;
let _pingTimeout: TimeoutID;
let _endpoints: Array<string> = [];
const RESERVE = {
    BASE: '20000000',
    OWNER: '5000000',
};
const BLOCKS = {
    MIN: 0,
    MAX: 0,
};
const TX_LIMIT: number = 100;

const timeoutHandler = async () => {
    if (_api && _api.isConnected()) {
        try {
            await _api.getServerInfo();
            _pingTimeout = setTimeout(timeoutHandler, 5000);
        } catch (error) {
            common.debug(`Error in timeout ping request: ${error}`)
        }
    }
}

const connect = async (): Promise<RippleAPI> => {
    if (_api) {
        // socket is already connected
        if (_api.isConnected()) return _api;
    }

    // validate endpoints
    if (common.getSettings().server.length < 1) {
        throw new Error('No servers');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.getSettings().server.slice(0);
    }

    common.debug('Connecting to', _endpoints[0]);
    const api = new RippleAPI({ server: _endpoints[0] });
   
    try {
        await api.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        _api = undefined;
        // connection error. remove endpoint
        _endpoints.splice(0, 1);
        // and try another one or throw error
        if (_endpoints.length < 1) {
            throw new Error('All backends are down');
        }
        return await connect();
    }

    // disable reconnecting
    // workaround: RippleApi which doesn't have possibility to disable reconnection
    // override private method and return never ending promise
    api.connection._retryConnect = () => {
        return new Promise(() => {});
    };

    api.on('ledger', ledger => {
        clearTimeout(_pingTimeout);
        _pingTimeout = setTimeout(timeoutHandler, 5000);

        // store current block/ledger values
        RESERVE.BASE = api.xrpToDrops(ledger.reserveBaseXRP);
        RESERVE.OWNER = api.xrpToDrops(ledger.reserveIncrementXRP);
        const availableBlocks = ledger.validatedLedgerVersions.split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0]);
        BLOCKS.MAX = parseInt(availableBlocks[1]);
    });

    api.on('disconnected', () => {
        clearTimeout(_pingTimeout);
        cleanup();
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
    });

    // mocking
    // setTimeout(() => {
    //     api.connection._ws._ws.close()
    // }, 6000);

    try {
        const availableBlocks = api.connection._availableLedgerVersions.serialize().split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0]);
        BLOCKS.MAX = parseInt(availableBlocks[1]);
    } catch (error) {
        const info = await api.getServerInfo();
        const availableBlocks = info.completeLedgers.split('-');
        BLOCKS.MIN = parseInt(availableBlocks[0]);
        BLOCKS.MAX = parseInt(availableBlocks[1]);
    }

    common.response({ id: -1, type: RESPONSES.CONNECTED });

    _api = api;
    return _api;
}

const cleanup = () => {
    if (_api) {
        _api.removeAllListeners();
        _api = undefined;
    }
    common.removeAddresses(common.getAddresses());
    common.clearSubscriptions();
}

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const api = await connect();
        const info = await api.getServerInfo();
        const block = await api.getLedgerVersion();
        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: {
                name: 'Ripple',
                shortcut: 'xrp',
                decimals: 6,
                block,
                fee: '',
                reserved: '0',
            },
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

// Custom request
// RippleApi doesn't support "ledger_index": "current", which will fetch data from mempool
const getMempoolAccountInfo = async (account: string): Promise<{ xrpBalance: string, sequence: number }> => {
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
// RippleApi returns parsed/formatted transactions, use own parsing
const getRawTransactions = async (account: string, options): Promise<Array<ResponseTypes.Transaction>> => {
    const api = await connect();
    const raw = await api.request('account_tx', {
        account,
        ledger_index_max: options.maxLedgerVersion,
        ledger_index_min: options.minLedgerVersion,
        limit: options.limit,
    });
    return raw.transactions.map(tx => utils.transformTransactionHistory(account, tx));
};

const getAccountInfo = async (data: { id: number } & MessageTypes.GetAccountInfo): Promise<void> => {
    const { payload } = data;
    const options: MessageTypes.GetAccountInfoOptions = payload.options || {};

    const account = {
        address: payload.descriptor,
        transactions: 0,
        block: 0,
        balance: '0',
        availableBalance: '0',
        reserve: RESERVE.BASE,
        sequence: 0,
    };

    try {
        const api = await connect();
        account.block = BLOCKS.MAX;

        const info = await api.getAccountInfo(payload.descriptor);
        const ownersReserve = info.ownerCount > 0 ? new BigNumber(info.ownerCount).multipliedBy(RESERVE.OWNER).toString() : '0';
        account.balance = api.xrpToDrops(info.xrpBalance);
        account.availableBalance = account.balance;
        account.sequence = info.sequence;
        account.reserve = new BigNumber(RESERVE.BASE).plus(ownersReserve).toString();
    } catch (error) {
        // empty account throws error "actNotFound"
        // catch it and respond with empty account
        if (error.message === 'actNotFound') {
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
        account.availableBalance = mempoolInfo.xrpBalance;
        account.sequence = mempoolInfo.sequence;
    } catch (error) {
        common.errorHandler({ id: data.id, error });
        return;
    }

    // get the reserve

    if (options.type !== 'transactions') {
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
        const api = await connect();
        const block = await api.getLedgerVersion();
        const minLedgerVersion = options.from ? Math.max(options.from, BLOCKS.MIN) : BLOCKS.MIN;
        const maxLedgerVersion = options.to ? Math.max(options.to, BLOCKS.MAX) : undefined;
        // determines if there is bottom limit
        const fetchAll: boolean = typeof options.limit !== 'number';
        const requestOptions = {
            minLedgerVersion,
            maxLedgerVersion,
            limit: fetchAll ? TX_LIMIT : options.limit,
        }

        let transactions: Array<ResponseTypes.Transaction> = [];
        if (!fetchAll) {
            // get only one page
            transactions = await getRawTransactions(payload.descriptor, requestOptions);
        } else {
            // get all pages at once
            let hasNextPage: boolean = true;
            while (hasNextPage) {
                const response = await getRawTransactions(payload.descriptor, requestOptions);
                transactions = utils.concatTransactions(transactions, response);
                // hasNextPage = response.length >= TX_LIMIT && transactions.length < 10000;
                hasNextPage = response.length >= TX_LIMIT;
                if (hasNextPage) {
                    requestOptions.maxLedgerVersion = response[response.length - 1].blockHeight;
                }
            }
        }

        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: {
                ...account,
                transactions,
                block,
            }
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        const api = await connect();
        const fee = await api.getFee();
        // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 12 drops to 6000+ drops for a moment
        // investigate more...
        const drops = api.xrpToDrops(fee);
        const payload = data.payload && Array.isArray(data.payload.levels) ? data.payload.levels.map(l => ({ name: l.name, value: drops })) : [ { name: 'Normal', value: drops } ];
        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const pushTransaction = async (data: { id: number } & MessageTypes.PushTransaction): Promise<void> => {
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
}

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;
    try {
        if (payload.type === 'notification') {
            await subscribeAddresses(payload.addresses, payload.mempool);
        } else if (payload.type === 'block') {
            await subscribeBlock();
        }
    } catch (error) {
        common.errorHandler({ id: data.id, error });
        return;
    }

    common.response({
        id: data.id,
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });
}

const subscribeAddresses = async (addresses: Array<string>, mempool: boolean = true) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await connect();
    if (!common.getSubscription('transaction')) {
        api.connection.on('transaction', onTransaction);
        // api.connection.on('ledgerClosed', onLedgerClosed);
        common.addSubscription('transaction');
    }

    const uniqueAddresses = common.addAddresses(addresses);
    if (uniqueAddresses.length > 0) {
        const request = {
            // stream: ['transactions', 'transactions_proposed'],
            accounts: uniqueAddresses,
            accounts_proposed: mempool ? uniqueAddresses : [],
        };
    
        await api.request('subscribe', request);
    }
}

const subscribeBlock = async () => {
    if (common.getSubscription('ledger')) return;
    const api = await connect();
    api.on('ledger', onNewBlock);
    common.addSubscription('ledger');
};

const unsubscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;
    try {
        if (payload.type === 'notification') {
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
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });
}

const unsubscribeAddresses = async (addresses: Array<string>) => {
    const subscribed = common.removeAddresses(addresses);
    const request = {
        // stream: ['transactions', 'transactions_proposed'],
        accounts: addresses,
        accounts_proposed: addresses,
    };
    const api = await connect();
    await api.request('unsubscribe', request);

    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.connection.removeListener('transaction', onTransaction);
        // api.connection.off('ledgerClosed', onLedgerClosed);
        common.removeSubscription('transaction')
    }
}

const unsubscribeBlock = async () => {
    if (!common.getSubscription('ledger')) return;
    const api = await connect();
    api.removeListener('ledger', onNewBlock);
    common.removeSubscription('ledger');
}

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
}

const onNewBlock = (event: any) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                block: event.ledgerVersion,
                hash: event.ledgerHash,
            }
        }
    });
}

const onTransaction = (event: any) => {
    if (event.type !== 'transaction') return;

    const subscribed = common.getAddresses();
    const sender = subscribed.indexOf(event.transaction.Account);
    const receiver = subscribed.indexOf(event.transaction.Destination);


    if (sender >= 0) {
        common.response({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: utils.transformTransactionEvent(subscribed[sender], event),
            }
        });
    }

    if (receiver >= 0) {
        common.response({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: utils.transformTransactionEvent(subscribed[receiver], event),
            }
        });
    }
    /*
    const status = event.validated ? 'confirmed' : 'pending';
    const hash = event.transaction.hash;
    const signature = event.transaction.TxnSignature;
    const amount = event.transaction.Amount;
    const fee = event.transaction.Fee;
    const total = new BigNumber(amount).plus(fee).toString();

    const txData = {
        status,
        timestamp: event.transaction.date,
        blockHeight: 0,

        inputs: [{ addresses: [event.transaction.Account] }],
        outputs: [{ addresses: [event.transaction.Destination] }],

        hash,
        amount,
        fee,
        total,
    };

    if (sender >= 0) {
        common.response({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    type: 'send',
                    descriptor: event.transaction.Account,
                    ...txData,
                }
            }
        });
    }

    if (receiver >= 0) {
        common.response({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    type: 'recv',
                    descriptor: event.transaction.Destination,
                    ...txData,
                }
            }
        });
    }
    */
}

// postMessage(1/x); // Intentional error.
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