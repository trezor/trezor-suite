/* @flow */

import { RippleAPI } from 'ripple-lib';
import * as MESSAGES from '../../constants/messages';
import * as RESPONSES from '../../constants/responses';

import type { Message, Response } from '../../types';
import * as MessageTypes from '../../types/messages';

declare function postMessage(data: Response): void;
declare function onmessage(event: { data: Message }): void;

// WebWorker message handling
onmessage = (event) => {
    if (!event.data) return;
    const { data } = event;

    console.log('RippleWorker:onmessage', event);
    switch (data.type) {
        case MESSAGES.INIT:
            init(data);
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
        default:
            handleError({
                id: data.id,
                error: new Error(`Unknown message type ${data.type}`)
            });
            break;
    }
};

const handleError = ({ id, error }: { id: number, error: Error}) => {
    postMessage({
        id,
        type: RESPONSES.ERROR,
        error: error.message
    });
}

let api: RippleAPI;

const init = async (data: { id: number } & MessageTypes.Init): Promise<void> => {
    api = new RippleAPI({
        server: 'wss://s.altnet.rippletest.net'
    });
    try {
        await api.connect();
        postMessage({
            id: data.id,
            type: RESPONSES.INIT,
        });
    } catch (error) {
        handleError(error);
    }
}

const connect = async (): Promise<RippleAPI> => {
    if (api) {
        if (api.isConnected) return api;
    }

    api = new RippleAPI({
        server: 'wss://s.altnet.rippletest.net'
    });

    await api.connect();
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
        handleError({ id: data.id, error });
    }
}

const getAccountInfo = async (data: { id: number } & MessageTypes.GetAccountInfo): Promise<void> => {
    const { payload } = data;
    if (payload.network !== 'ripple') {
        handleError({ id: data.id, error: new Error(`Invalid network ${payload.network}`) });
        return;
    }
    try {
        await connect();
        const info = await api.getAccountInfo(payload.address);
        postMessage({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: info,
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const pushTransaction = async (data: { id: number } & MessageTypes.PushTransaction): Promise<void> => {
    try {
        await connect();
        // tx_blob hex must be in upper case
        const info = await api.submit(data.payload.tx.toUpperCase());
        postMessage({
            id: data.id,
            type: RESPONSES.PUSH_TRANSACTION,
            payload: info,
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    try {
        await connect();

        // subscribe to new blocks, confirmed transactions for given addresses and mempool transactions for given addresses
        if (api.connection.listenerCount('transaction') < 1) {
            api.connection.on('ledgerClosed', notificationHandler)
            api.connection.on('transaction', notificationHandler)
        }
        // TODO: send unique addresses only...
        // test if different values will remove previous values
        // TODO: pair data.id with notificationHandler
        const info = await api.request('subscribe', {
            'streams': ['ledger'],
            'accounts': data.payload.addresses,
            'accounts_proposed': data.payload.addresses,
        });

        postMessage({
            id: data.id,
            type: RESPONSES.SUBSCRIBE,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const notificationHandler = (event: any): void => {
    postMessage({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        event
    });
}

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