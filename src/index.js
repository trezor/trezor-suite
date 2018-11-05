/* @flow */

import { MESSAGES } from './constants';
import { getInstance } from './workers/blockchain';
import * as $T from './types';

// TODO: global scope
// not set by default
let network: ?string; 

class BlockchainLink {

    static getInfo: $T.GetInfo = async (params) => {
        return await getInstance(network || params.network)
            .getInfo({ 
                type: MESSAGES.GET_INFO, 
                payload: params 
            });
    }

    static getAccountInfo: $T.GetAccountInfo = async (params) => {
        return await getInstance(network || params.network)
            .getAccountInfo({ 
                type: MESSAGES.GET_ACCOUNT_INFO,
                payload: params 
            });
    }

    static subscribe: $T.Subscribe = async (params) => {
        return await getInstance(network || params.network).subscribe({ type: MESSAGES.SUBSCRIBE, payload: params });
    }

    static unsubscribe: $T.Subscribe = async (params) => {
        return await getInstance(network || params.network).unsubscribe({ type: MESSAGES.SUBSCRIBE, payload: params });
    }

    static pushTransaction: $T.PushTransaction = async (params) => {
        return await getInstance(network || params.network).pushTransaction({ type: MESSAGES.PUSH_TRANSACTION, payload: params });
    }
}

export default BlockchainLink;