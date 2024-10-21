import WebSocket from 'ws';

import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type {
    BlockNotification,
    MempoolTransactionNotification,
    AddressNotification,
    Send,
    FiatRatesNotification,
    FilterRequestParams,
} from '@trezor/blockchain-link-types/src/blockbook';
import type {
    GetFiatRatesForTimestamps,
    GetFiatRatesTickersList,
    GetCurrentFiatRates,
} from '@trezor/blockchain-link-types/src/messages';
import type {
    AccountInfoParams,
    EstimateFeeParams,
    AccountBalanceHistoryParams,
    RpcCallParams,
} from '@trezor/blockchain-link-types/src/params';

import { BaseWebsocket } from '../baseWebsocket';
import { getSuiteVersion } from '@trezor/env-utils';

interface BlockbookEvents {
    block: BlockNotification;
    mempool: MempoolTransactionNotification;
    notification: AddressNotification;
    fiatRates: FiatRatesNotification;
}

export class BlockbookAPI extends BaseWebsocket<BlockbookEvents> {
    protected createWebsocket() {
        // url validation
        let { url } = this.options;
        if (typeof url !== 'string') {
            throw new CustomError('websocket_no_url');
        }

        // this resolves https->wss as well
        if (url.startsWith('http')) {
            url = url.replace('http', 'ws');
        }
        if (!url.endsWith('/websocket')) {
            const suffix = url.endsWith('/') ? 'websocket' : '/websocket';
            url += suffix;
        }

        // initialize connection,
        // options are not used in web builds (see ./src/utils/ws)
        return new WebSocket(url, {
            agent: this.options.agent,
            headers: {
                Origin: 'https://node.trezor.io',
                'User-Agent': `Trezor Suite ${getSuiteVersion()}`,
                ...this.options.headers,
            },
        });
    }

    protected ping() {
        return this.getBlockHash(1);
    }

    send: Send = (method, params = {}) => this.sendMessage({ method, params });

    getServerInfo() {
        return this.send('getInfo');
    }

    getBlockHash(block: number) {
        return this.send('getBlockHash', { height: block });
    }

    getBlock(block: number | string) {
        return this.send('getBlock', { id: `${block}` });
    }

    getBlockFilter(blockHash: string, filterParams?: FilterRequestParams) {
        return this.send('getBlockFilter', {
            blockHash,
            scriptType: 'taproot-noordinals',
            ...filterParams,
        });
    }

    getBlockFiltersBatch(
        bestKnownBlockHash: string,
        pageSize?: number,
        filterParams?: FilterRequestParams,
    ) {
        return this.send('getBlockFiltersBatch', {
            bestKnownBlockHash,
            pageSize,
            scriptType: 'taproot-noordinals',
            ...filterParams,
        });
    }

    getMempoolFilters(fromTimestamp?: number, filterParams?: FilterRequestParams) {
        return this.send('getMempoolFilters', {
            fromTimestamp,
            scriptType: 'taproot-noordinals',
            ...filterParams,
        });
    }

    getAccountInfo(payload: AccountInfoParams) {
        return this.send('getAccountInfo', payload);
    }

    getAccountUtxo(descriptor: string) {
        return this.send('getAccountUtxo', { descriptor });
    }

    getTransaction(txid: string) {
        return this.send('getTransaction', { txid });
    }

    pushTransaction(hex: string) {
        return this.send('sendTransaction', { hex });
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('estimateFee', payload);
    }

    rpcCall(payload: RpcCallParams) {
        return this.send('rpcCall', payload);
    }

    getCurrentFiatRates(payload: GetCurrentFiatRates['payload']) {
        return this.send('getCurrentFiatRates', payload);
    }

    getAccountBalanceHistory(payload: AccountBalanceHistoryParams) {
        return this.send('getBalanceHistory', payload);
    }

    getFiatRatesForTimestamps(payload: GetFiatRatesForTimestamps['payload']) {
        return this.send('getFiatRatesForTimestamps', payload);
    }

    getFiatRatesTickersList(payload: GetFiatRatesTickersList['payload']) {
        return this.send('getFiatRatesTickersList', payload);
    }

    subscribeAddresses(addresses: string[]) {
        this.removeSubscription('notification');
        this.addSubscription('notification', result => this.emit('notification', result));

        return this.send('subscribeAddresses', { addresses });
    }

    unsubscribeAddresses() {
        const index = this.removeSubscription('notification');

        return index >= 0 ? this.send('unsubscribeAddresses') : { subscribed: false };
    }

    subscribeBlock() {
        this.removeSubscription('block');
        this.addSubscription('block', result => this.emit('block', result));

        return this.send('subscribeNewBlock');
    }

    unsubscribeBlock() {
        const index = this.removeSubscription('block');

        return index >= 0 ? this.send('unsubscribeNewBlock') : { subscribed: false };
    }

    subscribeFiatRates(currency?: string) {
        this.removeSubscription('fiatRates');
        this.addSubscription('fiatRates', result => this.emit('fiatRates', result));

        return this.send('subscribeFiatRates', { currency });
    }

    unsubscribeFiatRates() {
        const index = this.removeSubscription('fiatRates');

        return index >= 0 ? this.send('unsubscribeFiatRates') : { subscribed: false };
    }

    subscribeMempool() {
        this.removeSubscription('mempool');
        this.addSubscription('mempool', result => this.emit('mempool', result));

        return this.send('subscribeNewTransaction');
    }

    unsubscribeMempool() {
        const index = this.removeSubscription('mempool');

        return index >= 0 ? this.send('unsubscribeNewTransaction') : { subscribed: false };
    }
}
