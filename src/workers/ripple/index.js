/* @flow */

import { RippleAPI } from 'ripple-lib';
import * as MESSAGES from '../../constants/messages';
import * as RESPONSES from '../../constants/responses';
import type { Message } from '../../types/messages';
import type { Response } from '../../types/responses';

declare function postMessage(data: Response): void;

// WebWorker message handling
// eslint-disable-next-line no-undef
onmessage = (event: { data: Message }) => {
    if (!event.data) return;

    console.log('RippleWorker:onmessage', event);
    switch (event.data.type) {
        case MESSAGES.INIT:
            init(event.data);
            break;
        case MESSAGES.GET_INFO:
            getInfo(event.data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(event.data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(event.data);
            break;
        case MESSAGES.SUBSCRIBE:
            subscribe(event.data);
            break;
    }
};

let api: RippleAPI;

const init = async (data: any) => {
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

const handleError = ({ id, error }: any) => {
    console.warn("HANDLE ERROR!", error)
    postMessage({
        id,
        type: RESPONSES.ERROR,
        error: error.message
    });
}

const getInfo = async (data: any) => {
    try {
        const info = await api.getServerInfo();
        postMessage({
            id: data.id,
            type: RESPONSES.INFO,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const getAccountInfo = async (data: any) => {
    try {
        const info = await api.getAccountInfo(data.address);
        postMessage({
            id: data.id,
            type: RESPONSES.ACCOUNT_INFO,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const pushTransaction = async (data: any) => {
    try {
        // tx_blob hex must be in upper case
        const info = await api.submit(data.tx.toUpperCase());
        postMessage({
            id: data.id,
            type: RESPONSES.PUSH_TRANSACTION,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const subscribe = async (data: any) => {
    try {
        // subscribe to new blocks, confirmed transactions for given addresses and mempoool transactions for given addresses
        const info = await api.request('subscribe', {
            "streams": ["ledger"],
            "accounts": data.addresses,
            "accounts_proposed": data.addresses,
        });
        postMessage({
            id: data.id,
            type: RESPONSES.SUBSCRIBE,
            info
        });
        api.connection.on('ledgerClosed', notificationHandler)
        api.connection.on('transaction', notificationHandler)
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const notificationHandler = (event) => {
    postMessage({
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