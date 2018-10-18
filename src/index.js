/* @flow */

import { MESSAGES } from './constants';
import { send } from './workers';

class BlockchainLink {
    constructor(options: any) {
        if (!window.Worker) return;
        if (!options) {
            // const worker = new Worker('workers/ripple/index.js');
            // workers.push(worker);
            // postMessage({
            //     type: MESSAGES.INFO
            // });
        }
    }

    async getInfo(params: any) {
        return await send({ type: MESSAGES.GET_INFO, ...params });
    }

    async getAccountInfo(params: any) {
        return await send({ type: MESSAGES.GET_ACCOUNT_INFO, ...params });
    }

    async pushTransaction(params: any) {
        return await send({ type: MESSAGES.PUSH_TRANSACTION, ...params });
    }
}

export default BlockchainLink;