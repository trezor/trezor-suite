import type {
    AccountBalanceHistoryParams,
    AccountInfoParams,
    BlockfrostBlockContent as BlockContent,
    BlockfrostTransaction,
    EstimateFeeParams,
    BlockfrostSend as Send,
} from '@trezor/blockchain-link-types';
import { getSuiteVersion } from '@trezor/env-utils';

import { BaseWebsocket } from '../baseWebsocket';

interface BlockfrostEvents {
    block: BlockContent;
    notification: BlockfrostTransaction;
}

export class BlockfrostAPI extends BaseWebsocket<BlockfrostEvents> {
    protected createWebsocket() {
        const { url } = this.options;

        return this.initWebsocket({
            url,
            agent: this.options.agent,
            headers: {
                'User-Agent': `Trezor Suite ${getSuiteVersion()}`,
                ...this.options.headers,
            },
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

        return this.sendMessage(
            { command: 'SUBSCRIBE_BLOCK' },
            { onIdCreated: id => this.addSubscription('block', id) },
        );
    }

    subscribeAddresses(addresses: string[]) {
        this.removeSubscription('notification');

        return this.sendMessage(
            { command: 'SUBSCRIBE_ADDRESS', params: { addresses } },
            { onIdCreated: id => this.addSubscription('notification', id) },
        );
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
