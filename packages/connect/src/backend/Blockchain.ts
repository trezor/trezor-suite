import BlockchainLink, {
    ServerInfo,
    SubscriptionAccountInfo,
    BlockchainLinkParams,
    BlockchainLinkResponse,
} from '@trezor/blockchain-link';
import { createBlockchainMessage, BLOCKCHAIN, CoreEventMessage } from '../events';
import { ERRORS } from '../constants';
import {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
    SolanaWorker,
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
        case 'solana':
            return SolanaWorker;
        default:
            return null;
    }
};

const getNormalizedTrezorShortcut = (shortcut: string) => {
    // There is no `rippled` setting that defines which network it uses neither mainnet or testnet
    // see: https://xrpl.org/parallel-networks.html
    if (shortcut === 'tXRP') {
        return 'XRP';
    }

    if (shortcut === 'OP') {
        return 'ETH';
    }

    return shortcut;
};

export type BlockchainOptions = {
    coinInfo: CoinInfo;
    postMessage: (message: CoreEventMessage) => void;
    proxy?: Proxy;
    debug?: boolean;
    identity?: string;
    onDisconnected?: (pendingSubscriptions?: boolean) => void;
};

export class Blockchain {
    link: BlockchainLink;
    serverInfo?: ServerInfo;

    readonly identity?: string;
    readonly coinInfo: BlockchainOptions['coinInfo'];
    readonly postMessage: BlockchainOptions['postMessage'];

    feeForBlock: BlockchainLinkResponse<'estimateFee'> = [];

    feeTimestamp = 0;

    private onDisconnected: BlockchainOptions['onDisconnected'];
    private initPromise?: Promise<ServerInfo>;

    constructor(options: BlockchainOptions) {
        this.identity = options.identity;
        this.coinInfo = options.coinInfo;
        this.postMessage = options.postMessage;
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
            ...(blockchainLink.type === 'ripple' ? { throttleBlockEvent: 60 * 1000 } : {}),
        });
    }

    onError(error: ERRORS.TrezorError) {
        const pendingSubscriptions =
            this.link.listenerCount('block') ||
            this.link.listenerCount('notification') ||
            this.link.listenerCount('fiatRates');

        this.link.dispose();
        this.postMessage(
            createBlockchainMessage(BLOCKCHAIN.ERROR, {
                coin: this.coinInfo,
                identity: this.identity,
                error: error.message,
                code: error.code,
            }),
        );
        this.onDisconnected?.(!!pendingSubscriptions);
    }

    /** should be called only once, from Blockchain.init() method */
    private async initLink() {
        let info;
        try {
            await this.link.connect();
            info = await this.link.getInfo();
        } catch (error) {
            throw ERRORS.TypedError('Backend_Error', error.message);
        }

        this.serverInfo = info;

        const trezorShortcut = getNormalizedTrezorShortcut(this.coinInfo.shortcut);
        const backendShortcut = this.serverInfo.shortcut;

        if (trezorShortcut.toLowerCase() !== backendShortcut.toLowerCase()) {
            throw ERRORS.TypedError('Backend_Invalid');
        }

        this.link.on('disconnected', () => {
            this.onError(ERRORS.TypedError('Backend_Disconnected'));
        });

        return info;
    }

    /** Method is idempotent (only the first call really starts the init process, subsequent calls just return the promise) */
    init() {
        if (!this.initPromise) {
            this.initPromise = this.initLink()
                .then(info => {
                    this.postMessage(
                        createBlockchainMessage(BLOCKCHAIN.CONNECT, {
                            coin: this.coinInfo,
                            identity: this.identity,
                            ...info,
                        }),
                    );
                    this.initPromise = Promise.resolve(info);

                    return info;
                })
                .catch(error => {
                    this.postMessage(
                        createBlockchainMessage(BLOCKCHAIN.ERROR, {
                            coin: this.coinInfo,
                            identity: this.identity,
                            error: error.message,
                            code: error.code,
                        }),
                    );
                    this.initPromise = Promise.reject(error);
                    this.link.dispose();

                    return this.initPromise;
                });
        }

        return this.initPromise;
    }

    getTransactions(txs: string[]) {
        return Promise.all(txs.map(id => this.link.getTransaction(id)));
    }

    getTransactionHexes(txids: string[]) {
        return Promise.all(txids.map(id => this.link.getTransactionHex(id)));
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

    rpcCall(params: BlockchainLinkParams<'rpcCall'>) {
        return this.link.rpcCall(params);
    }

    async estimateFee(request: Parameters<typeof this.link.estimateFee>[0]) {
        const { blocks } = request;
        // cache should be used if there is no specific data (ethereum case) and requested blocks are already cached/downloaded
        const useCache = !request.specific && Array.isArray(blocks) && blocks.length > 0;
        if (useCache) {
            // estimated fee levels cache is valid for 20 minutes
            const outdated = Date.now() - this.feeTimestamp > 20 * 60 * 1000;
            const unknownBlocks = outdated
                ? blocks
                : blocks.filter(block => !this.feeForBlock[block]);
            if (unknownBlocks.length < 1) {
                // all requested blocks are valid an known, return cached result
                return blocks.map(block => this.feeForBlock[block]);
            }
            // reset old values
            this.feeForBlock = [];
            // get new values
            const fees = await this.link.estimateFee(request);
            // cache blocks for future use
            blocks.forEach((block, index) => {
                this.feeForBlock[block] = fees[index];
            });
            this.feeTimestamp = Date.now();

            // return requested fees
            return fees;
        }

        return this.link.estimateFee(request);
    }

    subscribeBlocks() {
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

        return this.link.subscribe({ type: 'block' });
    }

    subscribeAccounts(accounts: SubscriptionAccountInfo[]) {
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

    unsubscribeBlocks() {
        this.link.removeAllListeners('block');

        return this.link.unsubscribe({ type: 'block' });
    }

    unsubscribeAccounts(accounts: SubscriptionAccountInfo[]) {
        // unsubscribe only requested accounts
        return this.link.unsubscribe({ type: 'accounts', accounts });
    }

    unsubscribeFiatRates() {
        this.link.removeAllListeners('fiatRates');

        return this.link.unsubscribe({ type: 'fiatRates' });
    }

    async unsubscribeAll() {
        this.link.removeAllListeners('notification');
        await this.unsubscribeFiatRates();

        return this.unsubscribeBlocks();
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
