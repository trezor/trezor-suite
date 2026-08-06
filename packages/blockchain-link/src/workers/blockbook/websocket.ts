import { CustomError } from '@trezor/blockchain-link-types';
import type {
    AccountBalanceHistoryParams,
    AccountInfoParams,
    BlockbookAddressNotification as AddressNotification,
    BlockbookBlockNotification as BlockNotification,
    EstimateFeeParams,
    BlockbookFiatRatesNotification as FiatRatesNotification,
    BlockbookFilterRequestParams as FilterRequestParams,
    BlockbookMempoolTransactionNotification as MempoolTransactionNotification,
    MessageTypes,
    BlockbookPush as Push,
    RpcCallParams,
    BlockbookSend as Send,
} from '@trezor/blockchain-link-types';
import { type GetContractInfo } from '@trezor/blockchain-link-types/src/messages';
import { getSuiteVersion } from '@trezor/env-utils';

import { BaseWebsocket } from '../baseWebsocket';

type GetCurrentFiatRates = MessageTypes.GetCurrentFiatRates;
type GetFiatRatesForTimestamps = MessageTypes.GetFiatRatesForTimestamps;
type GetFiatRatesTickersList = MessageTypes.GetFiatRatesTickersList;

/**
 * A push rejected by the default 20s deadline closes the socket and reports "send failed" while
 * blockbook may still broadcast the transaction — a retry then pays the recipient twice. Blockbook's
 * own budget for the call is longer (one 25s rpc_timeout for the relay broadcast, 3–4x that without
 * a relay acceptance; see its docs/evm-send.md), so wait for its answer instead. 60s is the most a
 * request can own: after 50s of silence the keep-alive ping fires with the 20s default, and any
 * expiry tears the socket down.
 */
const PUSH_TRANSACTION_TIMEOUT = 60 * 1000;

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

    send: Send = (method, params = {}) => this.sendMessage({ method, params });

    getServerInfo() {
        return this.send('getInfo');
    }

    getBlockHash(block: number) {
        return this.send('getBlockHash', { height: block });
    }

    getBlock(
        block: number | string,
        { page, pageSize }: { page?: number; pageSize?: number } = {},
    ) {
        return this.send('getBlock', { id: `${block}`, page, pageSize });
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

    pushTransaction(hex: string, disableAlternativeRPC?: boolean) {
        // Only sendMessage takes a per-request timeout; the send overloads have no room for one.
        return this.sendMessage(
            { method: 'sendTransaction', params: { hex, disableAlternativeRPC } },
            { timeout: PUSH_TRANSACTION_TIMEOUT },
        ) as Promise<Push>;
    }

    estimateFee(payload: EstimateFeeParams) {
        return this.send('estimateFee', payload);
    }

    rpcCall(payload: RpcCallParams) {
        return this.send('rpcCall', payload);
    }

    getContractInfo(payload: GetContractInfo['payload']) {
        return this.send('getContractInfo', payload);
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

        return this.sendMessage(
            { method: 'subscribeAddresses', params: { addresses } },
            { onIdCreated: id => this.addSubscription('notification', id) },
        );
    }

    unsubscribeAddresses() {
        const index = this.removeSubscription('notification');

        return index >= 0 ? this.send('unsubscribeAddresses') : { subscribed: false };
    }

    subscribeBlock() {
        this.removeSubscription('block');

        return this.sendMessage(
            { method: 'subscribeNewBlock' },
            { onIdCreated: id => this.addSubscription('block', id) },
        );
    }

    unsubscribeBlock() {
        const index = this.removeSubscription('block');

        return index >= 0 ? this.send('unsubscribeNewBlock') : { subscribed: false };
    }

    subscribeFiatRates(currency?: string) {
        this.removeSubscription('fiatRates');

        return this.sendMessage(
            { method: 'subscribeFiatRates', params: { currency } },
            { onIdCreated: id => this.addSubscription('fiatRates', id) },
        );
    }

    unsubscribeFiatRates() {
        const index = this.removeSubscription('fiatRates');

        return index >= 0 ? this.send('unsubscribeFiatRates') : { subscribed: false };
    }

    subscribeMempool() {
        this.removeSubscription('mempool');

        return this.sendMessage(
            { method: 'subscribeNewTransaction' },
            { onIdCreated: id => this.addSubscription('mempool', id) },
        );
    }

    unsubscribeMempool() {
        const index = this.removeSubscription('mempool');

        return index >= 0 ? this.send('unsubscribeNewTransaction') : { subscribed: false };
    }
}
