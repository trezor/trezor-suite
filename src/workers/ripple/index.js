/* @flow */

import { RippleAPI } from 'ripple-lib';
import { MESSAGES, RESPONSES } from '../../constants';
import * as common from '../common';

import type { Message, Response } from '../../types';
import * as MessageTypes from '../../types/messages';

declare function postMessage(data: Response): void;
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
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(data);
            break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        case MESSAGES.UNSUBSCRIBE:
            unsubscribe(data);
            break;
        default:
            common.errorHandler({
                id: data.id,
                error: new Error(`Unknown message type ${data.type}`)
            });
            break;
    }
};

let api: RippleAPI;
let _endpoints: Array<string> = [];

const connect = async (): Promise<RippleAPI> => {
    if (api) {
        // socket is already connected
        if (api.isConnected) return api;
    }

    // validate endpoints
    if (common.getSettings().server.length < 1) {
        throw new Error('No servers');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.getSettings().server.slice(0);
    }

    common.debug('Connecting to', _endpoints[0]);
    api = new RippleAPI({
        server: _endpoints[0]
    });
   
    try {
        await api.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        api = undefined;
        // connection error. remove endpoint
        _endpoints.splice(0, 1);
        // and try another one or throw error
        if (_endpoints.length < 1) {
            throw new Error('All backends are down');
        }
        return await connect();
    }

    common.debug('Connected');

    // api.on('disconnected', () => {
    //     console.warn("DISCONNECTED evt");
    // });
    // api.on('error', () => {
    //     console.warn("ERROR evt");
    // });
    // api.on('ledger', (ev) => {
    //     console.warn("LEDGER evt", ev);
    // });
    return api;
}

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        await connect();
        const info = await api.getServerInfo();
        console.warn("info", info, data)
        postMessage({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: info
        });
    } catch (error) {
        console.warn("GET IFO ERROR", typeof error, Object.keys(error), error.toString() )
        common.errorHandler({ id: data.id, error });
    }
}

const getAccountInfo = async (data: { id: number } & MessageTypes.GetAccountInfo): Promise<void> => {
    const { payload } = data;
    try {
        await connect();
        const info = await api.getAccountInfo(payload.descriptor);
        // https://github.com/ripple/ripple-lib/issues/879#issuecomment-377576063
        const transactions = await api.getTransactions(payload.descriptor, { 
            minLedgerVersion: 12748434,
            maxLedgerVersion: 14143636,
        });

        postMessage({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: {
                info,
                transactions,
            }
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const pushTransaction = async (data: { id: number } & MessageTypes.PushTransaction): Promise<void> => {
    try {
        await connect();
        // tx_blob hex must be in upper case
        const info = await api.submit(data.payload.toUpperCase());
        postMessage({
            id: data.id,
            type: RESPONSES.PUSH_TRANSACTION,
            payload: info,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    await connect();
    const { payload } = data;

    if (payload.type === 'address') {
        await subscribeAddresses(payload.addresses, payload.mempool);
    } else if (payload.type === 'block') {
        if (api.listenerCount('ledger') < 1) {
            api.on('ledger', onNewBlock);
        }
    }

    postMessage({
        id: data.id,
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });
}

const unsubscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    await connect();
    const { payload } = data;

    if (payload.type === 'address') {
        // await subscribeAddresses(payload.addresses, payload.mempool);
    } else if (payload.type === 'block') {
        if (api.listenerCount('ledger') > 0) {
            api.off('ledger', onNewBlock);
        }
    }

    postMessage({
        id: data.id,
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });

}

const subscribeAddresses = async (addresses: Array<string>, mempool: boolean = true) => {
    // subscribe to new blocks, confirmed transactions for given addresses and mempool transactions for given addresses
    if (api.connection.listenerCount('transaction') < 1) {
        api.connection.on('transaction', onTransaction);
        api.connection.on('ledgerClosed', onLedgerClosed);
    }

    const request: { accounts: Array<string>, accounts_proposed?: Array<string> } = {
        accounts: addresses,
    };
    if (mempool) {
        request.accounts_proposed = addresses;
    }

    await api.request('subscribe', request);
}

const onNewBlock = (event: any) => {
    postMessage({
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
    postMessage({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'address',
            data: event
        }
    });
}

const onLedgerClosed = (event: any) => {
    postMessage({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'address',
            data: event
        }
    });
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