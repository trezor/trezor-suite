import WebSocket from 'ws';

import type {
    Send,
    BlockContent,
    BlockfrostTransaction,
} from '@trezor/blockchain-link-types/lib/blockfrost';
import type {
    AccountInfoParams,
    EstimateFeeParams,
    AccountBalanceHistoryParams,
} from '@trezor/blockchain-link-types/lib/params';

import { BaseWebsocket } from '../baseWebsocket';

interface BlockfrostEvents {
    block: BlockContent;
    notification: BlockfrostTransaction;
}

export class BlockfrostAPI extends BaseWebsocket<BlockfrostEvents> {
    protected createWebsocket() {
        const { url } = this.options;

        // options are not used in web builds (see ./src/utils/ws)
        return new WebSocket(url, {
            agent: this.options.agent,
        });
    }

    protected ping() {
        return this.getBlockHash(1);
    }

    send: Send = (command, params = {}) => this.sendMessage({ command, params });

    getServerInfo() {
        return this.send('GET_SERVER_INFO');
    }

    getBlockHash(number: number) {
        return this.send('GET_BLOCK', { hashOrNumber: number });
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('ESTIMATE_FEE', payload);
    }

    getAccountInfo(payload: AccountInfoParams) {
        return this.send('GET_ACCOUNT_INFO', payload);
    }

    getAccountUtxo(descriptor: string) {
        return this.send('GET_ACCOUNT_UTXO', { descriptor });
    }

    getAccountBalanceHistory(payload: AccountBalanceHistoryParams) {
        return this.send('GET_BALANCE_HISTORY', payload);
    }

    getTransaction(txId: string) {
        return this.send('GET_TRANSACTION', { txId });
    }

    pushTransaction(txData: string) {
        return this.send('PUSH_TRANSACTION', { txData });
    }

    subscribeBlock() {
        this.removeSubscription('block');
        this.addSubscription('block', result => this.emit('block', result));

        return this.send('SUBSCRIBE_BLOCK');
    }

    subscribeAddresses(addresses: string[]) {
        this.removeSubscription('notification');
        this.addSubscription('notification', result => this.emit('notification', result));

        return this.send('SUBSCRIBE_ADDRESS', { addresses });
    }

    unsubscribeBlock() {
        const index = this.removeSubscription('block');

        return index >= 0 ? this.send('UNSUBSCRIBE_BLOCK') : { subscribed: false };
    }

    unsubscribeAddresses() {
        const index = this.removeSubscription('notification');

        return index >= 0 ? this.send('UNSUBSCRIBE_ADDRESS') : { subscribed: false };
    }
}
