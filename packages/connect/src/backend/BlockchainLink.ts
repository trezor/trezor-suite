// REF-TODO: solve eslint
/* eslint-disable @typescript-eslint/no-use-before-define */

import BlockchainLink, {
    SubscriptionAccountInfo,
    BlockchainLinkParams,
    BlockchainLinkResponse,
} from '@trezor/blockchain-link';
import { DataManager } from '../data/DataManager';
import { BlockchainMessage, BLOCKCHAIN } from '../events';
import { ERRORS } from '../constants';
import { getOnionDomain } from '../utils/urlUtils';
import type { CoinInfo, Proxy } from '../types';
import type { CoreMessage } from '../events';

import {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
} from '../workers/workers';

type Options = {
    coinInfo: CoinInfo;
    postMessage: (message: CoreMessage) => void;
    proxy?: Proxy;
    onionDomains?: { [domain: string]: string };
    debug?: boolean;
};

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

export class Blockchain {
    link: BlockchainLink;

    coinInfo: Options['coinInfo'];

    onionDomains: { [onion: string]: string };

    postMessage: Options['postMessage'];

    feeForBlock: BlockchainLinkResponse<'estimateFee'> = [];

    feeTimestamp = 0;

    constructor(options: Options) {
        this.coinInfo = options.coinInfo;
        this.postMessage = options.postMessage;

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

        // map clean urls in to object. key = onion domain, value = clean domain
        const { onionDomains } = options;
        this.onionDomains = onionDomains
            ? blockchainLink.url.reduce((a: Record<string, string>, url) => {
                  const onion = getOnionDomain(url, onionDomains);
                  // NOTE: onion is not necessarily an onion domain.
                  if (onion !== url) {
                      a[onion] = url;
                  }
                  return a;
              }, {})
            : {};

        const server = Object.keys(this.onionDomains).length
            ? Object.keys(this.onionDomains)
            : blockchainLink.url;

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
            BlockchainMessage(BLOCKCHAIN.ERROR, {
                coin: this.coinInfo,
                error: error.message,
                code: error.code,
            }),
        );
        removeBackend(this); // eslint-disable-line no-use-before-define
    }

    async init() {
        this.link.on('connected', async () => {
            const info = await this.link.getInfo();
            // There is no `rippled` setting that defines which network it uses neither mainnet or testnet
            // see: https://xrpl.org/parallel-networks.html
            const shortcut = this.coinInfo.shortcut === 'tXRP' ? 'XRP' : this.coinInfo.shortcut;
            if (info.shortcut.toLowerCase() !== shortcut.toLowerCase()) {
                this.onError(ERRORS.TypedError('Backend_Invalid'));
                return;
            }

            // find clean domain for current connection
            const cleanUrl = this.onionDomains[info.url];

            // eslint-disable-next-line no-use-before-define
            setPreferredBacked(this.coinInfo, cleanUrl || info.url);

            this.postMessage(
                BlockchainMessage(BLOCKCHAIN.CONNECT, {
                    coin: this.coinInfo,
                    ...info,
                    cleanUrl,
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

    getCurrentFiatRates(params: { currencies?: string[] }) {
        return this.link.getCurrentFiatRates(params);
    }

    getFiatRatesForTimestamps(params: { timestamps: number[] }) {
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
                    BlockchainMessage(BLOCKCHAIN.BLOCK, {
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
                    BlockchainMessage(BLOCKCHAIN.NOTIFICATION, {
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
                    BlockchainMessage(BLOCKCHAIN.FIAT_RATES_UPDATE, {
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

const instances: Blockchain[] = [];
const customBackends: { [coin: string]: CoinInfo } = {};
const preferredBackends: { [coin: string]: CoinInfo } = {};

const removeBackend = (backend: Blockchain) => {
    const index = instances.indexOf(backend);
    if (index >= 0) {
        instances.splice(index, 1);
    }
};

export const findBackend = (name: string) => {
    for (let i = 0; i < instances.length; i++) {
        if (instances[i].coinInfo.name === name) {
            return instances[i];
        }
    }
    return null;
};

// keep backend as a preferred once connection is successfully made
// switching between urls could lead to side effects (mempool differences, non existing/missing pending transactions)
const setPreferredBacked = (coinInfo: CoinInfo, url?: string) => {
    if (!url) {
        delete preferredBackends[coinInfo.shortcut];
    } else if (coinInfo.blockchainLink) {
        coinInfo.blockchainLink.url = [url];
        preferredBackends[coinInfo.shortcut] = coinInfo;
    }
};

export const setCustomBackend = (
    coinInfo: CoinInfo,
    blockchainLink: CoinInfo['blockchainLink'],
) => {
    setPreferredBacked(coinInfo); // reset preferred backend
    if (!blockchainLink || blockchainLink.url.length === 0) {
        delete customBackends[coinInfo.shortcut];
    } else {
        customBackends[coinInfo.shortcut] = coinInfo;
        customBackends[coinInfo.shortcut].blockchainLink = blockchainLink;
    }
};

export const isBackendSupported = (coinInfo: CoinInfo) => {
    const info = customBackends[coinInfo.shortcut] || coinInfo;
    if (!info.blockchainLink) {
        throw ERRORS.TypedError('Backend_NotSupported');
    }
};

export const initBlockchain = async (coinInfo: CoinInfo, postMessage: Options['postMessage']) => {
    let backend = findBackend(coinInfo.name);
    if (!backend) {
        backend = new Blockchain({
            coinInfo:
                preferredBackends[coinInfo.shortcut] ||
                customBackends[coinInfo.shortcut] ||
                coinInfo,
            postMessage,
            debug: DataManager.getSettings('debug'),
            proxy: DataManager.getSettings('proxy'),
            onionDomains:
                DataManager.getSettings('useOnionLinks') && !customBackends[coinInfo.shortcut]
                    ? DataManager.getConfig().onionDomains
                    : undefined,
        });
        instances.push(backend);

        try {
            await backend.init();
        } catch (error) {
            removeBackend(backend);
            setPreferredBacked(coinInfo); // reset preferred backend
            throw error;
        }
    }
    return backend;
};

export const reconnectAllBackends = () => {
    // collect all running backends as parameters tuple
    const params: [CoinInfo, Options['postMessage']][] = instances.map(i => [
        i.coinInfo,
        i.postMessage,
    ]);
    // remove all backends
    while (instances.length > 0) {
        instances[0].disconnect();
    }
    // initialize again using params tuple
    return Promise.all(params.map(p => initBlockchain(...p)));
};

export const dispose = () => {
    while (instances.length > 0) {
        instances[0].disconnect();
    }
};
