import BlockchainLink, {
    ServerInfo,
    SubscriptionAccountInfo,
    BlockchainLinkParams,
    BlockchainLinkResponse,
} from '@trezor/blockchain-link';
import { createBlockchainMessage, BLOCKCHAIN, PostMessage } from '../events';
import { ERRORS } from '../constants';
import {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
} from '../workers/workers';

import type { CoinInfo, Proxy } from '../types';

const getWorker = (type: string) => {
    switch (type) {
        case 'blockbook':
            return BlockbookWorker;
        case 'ripple':
            return RippleWorker;
        case 'blockfrost':
            return BlockfrostWorker;
        case 'electrum':
            return ElectrumWorker;
        default:
            return null;
    }
};

export type BlockchainOptions = {
    coinInfo: CoinInfo;
    postMessage: PostMessage;
    proxy?: Proxy;
    debug?: boolean;
    onConnected?: (url: string) => void;
    onDisconnected?: () => void;
};

export class Blockchain {
    link: BlockchainLink;
    serverInfo?: ServerInfo;
    coinInfo: BlockchainOptions['coinInfo'];

    postMessage: BlockchainOptions['postMessage'];

    feeForBlock: BlockchainLinkResponse<'estimateFee'> = [];

    feeTimestamp = 0;

    private onConnected: BlockchainOptions['onConnected'];
    private onDisconnected: BlockchainOptions['onDisconnected'];

    constructor(options: BlockchainOptions) {
        this.coinInfo = options.coinInfo;
        this.postMessage = options.postMessage;
        this.onConnected = options.onConnected;
        this.onDisconnected = options.onDisconnected;

        const { blockchainLink } = options.coinInfo;
        if (!blockchainLink) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }

        const worker = getWorker(blockchainLink.type);
        if (!worker) {
            throw ERRORS.TypedError(
                'Backend_WorkerMissing',
                `BlockchainLink worker not found ${blockchainLink.type}`,
            );
        }

        const server = blockchainLink.url;

        this.link = new BlockchainLink({
            name: this.coinInfo.shortcut,
            worker,
            server,
            debug: options.debug,
            proxy: options.proxy,
        });
    }

    onError(error: ERRORS.TrezorError) {
        this.link.dispose();
        this.postMessage(
            createBlockchainMessage(BLOCKCHAIN.ERROR, {
                coin: this.coinInfo,
                error: error.message,
                code: error.code,
            }),
        );
        this.onDisconnected?.();
    }

    async init() {
        this.link.on('connected', async () => {
            const info = await this.link.getInfo();
            this.serverInfo = info;
            // There is no `rippled` setting that defines which network it uses neither mainnet or testnet
            // see: https://xrpl.org/parallel-networks.html
            const shortcut = this.coinInfo.shortcut === 'tXRP' ? 'XRP' : this.coinInfo.shortcut;
            if (info.shortcut.toLowerCase() !== shortcut.toLowerCase()) {
                this.onError(ERRORS.TypedError('Backend_Invalid'));
                return;
            }

            this.onConnected?.(info.url);

            this.postMessage(
                createBlockchainMessage(BLOCKCHAIN.CONNECT, {
                    coin: this.coinInfo,
                    ...info,
                }),
            );
        });

        this.link.on('disconnected', () => {
            this.onError(ERRORS.TypedError('Backend_Disconnected'));
        });

        this.link.on('error', error => {
            this.onError(ERRORS.TypedError('Backend_Error', error.message));
        });

        try {
            await this.link.connect();
        } catch (error) {
            this.onError(ERRORS.TypedError('Backend_Error', error.message));
            throw error;
        }
    }

    getTransactions(txs: string[]) {
        return Promise.all(txs.map(id => this.link.getTransaction(id)));
    }

    getCurrentFiatRates(params: { currencies?: string[]; token?: string }) {
        return this.link.getCurrentFiatRates(params);
    }

    getFiatRatesForTimestamps(params: {
        currencies?: string[];
        timestamps: number[];
        token?: string;
    }) {
        return this.link.getFiatRatesForTimestamps(params);
    }

    getAccountBalanceHistory(params: BlockchainLinkParams<'getAccountBalanceHistory'>) {
        return this.link.getAccountBalanceHistory(params);
    }

    getNetworkInfo() {
        return this.link.getInfo();
    }

    getAccountInfo(request: BlockchainLinkParams<'getAccountInfo'>) {
        return this.link.getAccountInfo(request);
    }

    getAccountUtxo(descriptor: string) {
        return this.link.getAccountUtxo(descriptor);
    }

    async estimateFee(request: { blocks?: number[] }) {
        const { blocks } = request;
        if (blocks) {
            const now = Date.now();
            const outdated = now - this.feeTimestamp > 20 * 60 * 1000;
            const unknownBlocks = blocks.filter(() => typeof this.feeForBlock !== 'string');
            if (!outdated && unknownBlocks.length < 1) {
                // return cached
            }
            // get new values
            const fees = await this.link.estimateFee(request);
            // cache blocks for future use
            blocks.forEach((block, index) => {
                this.feeForBlock[block] = fees[index];
            });
            this.feeTimestamp = now;
            return fees;
        }
        return this.link.estimateFee(request);
    }

    async subscribe(accounts?: SubscriptionAccountInfo[]) {
        // set block listener if it wasn't set before
        if (this.link.listenerCount('block') === 0) {
            this.link.on('block', block => {
                this.postMessage(
                    createBlockchainMessage(BLOCKCHAIN.BLOCK, {
                        coin: this.coinInfo,
                        ...block,
                    }),
                );
            });
        }

        // set notification listener if it wasn't set before
        if (this.link.listenerCount('notification') === 0) {
            this.link.on('notification', notification => {
                this.postMessage(
                    createBlockchainMessage(BLOCKCHAIN.NOTIFICATION, {
                        coin: this.coinInfo,
                        notification,
                    }),
                );
            });
        }

        const blockSubscription = await this.link.subscribe({ type: 'block' });
        if (!accounts) {
            return blockSubscription;
        }

        return this.link.subscribe({
            type: 'accounts',
            accounts,
        });
    }

    subscribeFiatRates(_currency?: string) {
        // set block listener if it wasn't set before
        if (this.link.listenerCount('fiatRates') === 0) {
            this.link.on('fiatRates', ({ rates }) => {
                this.postMessage(
                    createBlockchainMessage(BLOCKCHAIN.FIAT_RATES_UPDATE, {
                        coin: this.coinInfo,
                        rates,
                    }),
                );
            });
        }

        return this.link.subscribe({
            type: 'fiatRates',
        });
    }

    async unsubscribe(accounts?: SubscriptionAccountInfo[]) {
        if (!accounts) {
            this.link.removeAllListeners('block');
            this.link.removeAllListeners('fiatRates');
            this.link.removeAllListeners('notification');

            // remove all subscriptions
            await this.link.unsubscribe({ type: 'fiatRates' });
            return this.link.unsubscribe({ type: 'block' });
        }
        // unsubscribe only requested accounts
        return this.link.unsubscribe({ type: 'accounts', accounts });
    }

    unsubscribeFiatRates() {
        this.link.removeAllListeners('fiatRates');
        return this.link.unsubscribe({ type: 'fiatRates' });
    }

    pushTransaction(tx: string) {
        return this.link.pushTransaction(tx);
    }

    disconnect() {
        this.link.removeAllListeners();
        this.link.disconnect();
        this.onError(ERRORS.TypedError('Backend_Disconnected'));
    }
}
