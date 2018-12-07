/* @flow */
import { MESSAGES, RESPONSES } from '../../constants';
import * as common from '../common';
import Connection from './socket';

import type { Message, Response } from '../../types';
import * as MessageTypes from '../../types/messages';

declare function postMessage(data: Response): void;
declare function onmessage(event: { data: Message }): void;

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
        // case MESSAGES.PUSH_TRANSACTION:
        //     pushTransaction(data);
        //     break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        // case MESSAGES.UNSUBSCRIBE:
        //     unsubscribe(data);
        //     break;
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

let _connection: ?Connection;
let _endpoints: Array<string> = [];

const connect = async (): Promise<Connection> => {
    if (_connection) {
        if (_connection.isConnected()) return _connection;
    }

    // validate endpoints
    if (common.getSettings().server.length < 1) {
        throw new Error('No servers');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.getSettings().server.slice(0);
    }

    common.debug('Connecting to', _endpoints[0]);
    _connection = new Connection(_endpoints[0]);
   
    try {
        await _connection.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        _connection = undefined;
        // connection error. remove endpoint
        _endpoints.splice(0, 1);
        // and try another one or throw error
        if (_endpoints.length < 1) {
            throw new Error('All backends are down');
        }
        return await connect();
    }

    _connection.on('disconnected', () => {
        cleanup();
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
    });

    common.response({
        id: -1,
        type: RESPONSES.CONNECTED,
    });

    common.debug('Connected');
    return _connection;
}

const cleanup = () => {
    if (_connection) {
        _connection.removeAllListeners();
        _connection = undefined;
    }
    common.removeAddresses(common.getAddresses());
}

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const socket = await connect();
        const info = await socket.getServerInfo();
        console.warn("info", info, data)
        postMessage({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: info
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
}

const getAccountInfo = async (data: { id: number } & MessageTypes.GetAccountInfo): Promise<void> => {
    const { payload } = data;
    // const account = {
    //     address: payload.descriptor,
    //     transactions: 0,
    //     block: 0,
    //     balance: '0',
    //     availableBalance: '0',
    //     sequence: 0,
    // };

    try {
        const socket = await connect();
        const info = await socket.getAccountInfo(payload.descriptor);
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: info,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

let _subscription: {[key: string]: boolean} = {};
const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;

    try {
        if (payload.type === 'notification') {
            await subscribeAddresses(payload.addresses, payload.mempool);
        } else if (payload.type === 'block') {
            const socket = await connect();
            if (!_subscription.block) {
                _subscription.block = true;
                socket.on('block', onNewBlock);
            }
            socket.subscribeBlock();
        }
    } catch (error) {
        common.errorHandler({ id: data.id, error });
        return;
    }

    postMessage({
        id: data.id,
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });
}

const subscribeAddresses = async (addresses: Array<string>, mempool: boolean = true) => {
    console.warn("ELO?")
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const socket = await connect();
    if (!_subscription.notification) {
        socket.on('notification', onTransaction);
    }

    const uniqueAddresses = common.addAddresses(addresses);
    if (uniqueAddresses.length > 0) {
        await socket.subscribeAddresses(uniqueAddresses);
    }
}

const disconnect = async (data: { id: number }) => {
    if (!_connection) {
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
        return;
    }
    try {
        await _connection.disconnect();
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const onNewBlock = (data: any) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            data,
        }
    });
};

const onTransaction = (event: any) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            data: event,
        }
    });
};

common.handshake();