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
        // case MESSAGES.GET_ACCOUNT_INFO:
        //     getAccountInfo(data);
        //     break;
        // case MESSAGES.PUSH_TRANSACTION:
        //     pushTransaction(data);
        //     break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        // case MESSAGES.UNSUBSCRIBE:
        //     unsubscribe(data);
        //     break;
        default:
            common.errorHandler({
                id: data.id,
                error: new Error(`Unknown message type ${data.type}`)
            });
            break;
    }
};

let connection: ?Connection;
let _endpoints: Array<string> = [];

const connect = async (): Promise<Connection> => {
    if (connection) {
        if (connection.isConnected()) return connection;
    }

    // validate endpoints
    if (common.getSettings().server.length < 1) {
        throw new Error('No servers');
    }

    if (_endpoints.length < 1) {
        _endpoints = common.getSettings().server.slice(0);
    }

    common.debug('Connecting to', _endpoints[0]);
    connection = new Connection(_endpoints[0]);
   
    try {
        await connection.connect();
    } catch (error) {
        common.debug('Websocket connection failed');
        connection = null;
        // connection error. remove endpoint
        _endpoints.splice(0, 1);
        // and try another one or throw error
        if (_endpoints.length < 1) {
            throw new Error('All backends are down');
        }
        return await connect();
    }

    common.debug('Connected');
    return connection;
}

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const c = await connect();
        const info = await c.getServerInfo();
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

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const c = await connect();
    c.subscribe();
    // const { payload } = data;

    // if (payload.type === 'address') {
    //     await subscribeAddresses(payload.addresses, payload.mempool);
    // } else if (payload.type === 'block') {
    //     if (api.listenerCount('ledger') < 1) {
    //         api.on('ledger', onNewBlock);
    //     }
    // }

    postMessage({
        id: data.id,
        type: RESPONSES.SUBSCRIBE,
        payload: true,
    });
}

common.handshake();