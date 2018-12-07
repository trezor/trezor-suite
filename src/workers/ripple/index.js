/* @flow */

import { RippleAPI } from 'ripple-lib';
import BigNumber from 'bignumber.js';
import { MESSAGES, RESPONSES } from '../../constants';
import * as common from '../common';

import type { Message } from '../../types';
import * as MessageTypes from '../../types/messages';

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
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
            break;
        case MESSAGES.GET_TRANSACTIONS:
            getTransactions(data);
            break;
        case MESSAGES.GET_FEE:
            getFee(data);
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
let _minLedgerVersion: number = 0;
let _endpoints: Array<string> = [];

const timeoutHandler = async () => {
    if (_api && _api.isConnected) {
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
        if (_api.isConnected) return _api;
    }

    // validate endpoints
    if (common.getSettings().server.length < 1) {
        throw new Error('No servers');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.getSettings().server.slice(0);
    }

    common.debug('Connecting to', _endpoints[0]);
    _api = new RippleAPI({
        server: _endpoints[0],
        // server: "wss://s1.ripple.com"
        // server: "wss://s-east.ripple.com"
        // server: "wss://s-west.ripple.com"
    });
   
    try {
        await _api.connect();
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
    _api.connection._retryConnect = () => {
        return new Promise(() => {});
    };

    _api.on('ledger', () => {
        clearTimeout(_pingTimeout);
        _pingTimeout = setTimeout(timeoutHandler, 5000);
    });

    _api.on('disconnected', () => {
        clearTimeout(_pingTimeout);
        cleanup();
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
    });

    // mocking
    // setTimeout(() => {
    //     console.warn("KOLLIN!")
    //     api.connection._ws._ws.close()
    // }, 6000);

    common.response({
        id: -1,
        type: RESPONSES.CONNECTED,
    });

    const info = await _api.getServerInfo();
    _minLedgerVersion = parseInt(info.completeLedgers.split('-')[0]);

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
        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: info
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const getRawAccountInfo = async (account: string): Promise<{ xrpBalance: string, sequence: number }> => {
    const api = await connect();
    const info = await api.request('account_info', {
        account,
        ledger_index: 'current',
        queue: true,
    });
    return {
        xrpBalance: info.account_data.Balance,
        sequence: info.account_data.Sequence,
    }
}

const getAccountInfo = async (data: { id: number } & MessageTypes.GetAccountInfo): Promise<void> => {
    const { payload } = data;
    const account = {
        address: payload.descriptor,
        transactions: 0,
        block: 0,
        balance: '0',
        availableBalance: '0',
        sequence: 0,
    };

    try {
        const api = await connect();
        const info = await api.getAccountInfo(payload.descriptor);
        account.balance = api.xrpToDrops(info.xrpBalance);
        account.availableBalance = account.balance;
        account.sequence = info.sequence;
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

    if (payload.mempool) {
        try {
            const mempoolInfo = await getRawAccountInfo(payload.descriptor);
            account.availableBalance = mempoolInfo.xrpBalance;
            account.sequence = mempoolInfo.sequence;
        } catch (error) {
            common.errorHandler({ id: data.id, error });
        }
    }

    if (!payload.history) {
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        });
    }

    try {
        // https://github.com/ripple/ripple-lib/issues/879#issuecomment-377576063
        // 42856666
        const api = await connect();
        const transactions = await api.getTransactions(payload.descriptor, {
            minLedgerVersion: _minLedgerVersion,
            // start: '660371D3A9B15E9781EED508090962890B99C67277E9F9024E899430D47D3FFD',
            limit: 20,
            // maxLedgerVersion: 14143636,
        });

        const block = await api.getLedgerVersion();

        // https://developers.ripple.com/rippled-api.html#markers-and-pagination
        // if (api.hasNextPage(transactions)) {
            
        //     // https://developers.ripple.com/rippleapi-reference.html#parameters
        //     // const nextPage = api.requestNextPage('getTransactions', transactions);
        // }

        // const xrpDrops = new BigNumber(info.xrpBalance).multipliedBy('1000000').toString();
        //console.warn("ACCount drops", xrpDrops)

        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: {
                ...account,
                transactions: transactions.length,
                block,
            }
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const getTransactions = async (data: { id: number } & MessageTypes.GetTransactions): Promise<void> => {
    const { payload } = data;
    try {
        const api = await connect();
        const transactions = await api.getTransactions(payload.descriptor, {
            minLedgerVersion: _minLedgerVersion,
            start: 0,
            limit: 10,
            // maxLedgerVersion: 14143636,
        });
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: transactions
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const getFee = async (data: { id: number } & MessageTypes.GetFee): Promise<void> => {
    try {
        const api = await connect();
        const fee = await api.getFee();
        // const converted = new BigNumber(fee).multipliedBy('1000000');
        const drops = api.xrpToDrops(fee);
        // convert value to satoshi: * 1000000
        common.response({
            id: data.id,
            type: RESPONSES.GET_FEE,
            payload: drops,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

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
        if (payload.type === 'address') {
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
        api.connection.off('transaction', onTransaction);
        // api.connection.off('ledgerClosed', onLedgerClosed);
        common.removeSubscription('transaction')
    }
}

const unsubscribeBlock = async () => {
    if (!common.getSubscription('ledger')) return;
    const api = await connect();
    api.off('ledger', onNewBlock);
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
            data: {
                block: event.ledgerVersion,
                hash: event.ledgerHash,
            }
        }
    });
}

const onTransaction = (event: any) => {
    if (event.type === 'transaction') {
        const subscribed = common.getAddresses();
        const sender = subscribed.indexOf(event.transaction.Account);
        const receiver = subscribed.indexOf(event.transaction.Destination);
        const status = event.validated ? 'confirmed' : 'pending';
        const hash = event.transaction.hash;
        const signature = event.transaction.TxnSignature;
        const amount = event.transaction.Amount;
        const fee = event.transaction.Fee;
        const total = new BigNumber(amount).plus(fee).toString();

        if (sender >= 0) {
            common.response({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'notification',
                    data: {
                        type: 'send',
                        address: event.transaction.Account,
                        status,
                        signature,
                        hash,
                        amount,
                        fee,
                        total,
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
                    data: {
                        type: 'recv',
                        address: event.transaction.Destination,
                        status,
                        signature,
                        hash,
                        amount,
                        fee,
                        total,
                    }
                }
            });
        }
    }
}

// postMessage(1/x); // Intentional error.
common.handshake();




// // Testnet account
// // addr: rGz6kFcejym5ZEWnzUCwPjxcfwEPRUPXXG
// // secret: ss2BKjSc4sMdVXcTHxzjyQS2vyhrQ

// // Trezor account
// // rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H

// api.connect().then(() => {
//     /* begin custom code ------------------------------------ */
//     

//     console.log('getting account info for', myAddress);
//     return api.getAccountInfo(myAddress);

// }).then(info => {
//     console.log(info);
//     console.log('getAccountInfo done');

//     /* end custom code -------------------------------------- */
// }).then(() => {
//     return api.disconnect();
// }).then(() => {
//     console.log('done and disconnected.');
// }).catch(console.error);

// rpNqAwVKdyWxZoHerUzDfgEEobNQPnQgPU

// rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy - exachnge

// rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV - exchange2

// from: https://i.redd.it/zwcthelefj901.png