import type {
    BlockchainLinkParams,
    ServerInfo,
    SubscriptionAccountInfo,
} from '@trezor/blockchain-link';
import { BlockchainLink } from '@trezor/blockchain-link';
import type { CoinInfo, CoreEventMessage, Proxy } from '@trezor/connect-common';
import { BLOCKCHAIN, createBlockchainMessage } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { type CanonicalDescriptor } from '@trezor/utils';

import {
    BlockbookWorker,
    BlockfrostWorker,
    ElectrumWorker,
    EvmRpcWorker,
    RippleWorker,
    SolanaWorker,
    StellarWorker,
} from '../workers/workers';

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
        case 'stellar':
            return StellarWorker;
        case 'evm-rpc':
            return EvmRpcWorker;
        default:
            return null;
    }
};

const maxNonce = (primary: string | undefined, broadcast: string) =>
    primary !== undefined && Number(primary) > Number(broadcast) ? primary : broadcast;

const getNormalizedTrezorShortcut = (shortcut: string) => {
    // There is no `rippled` setting that defines which network it uses neither mainnet or testnet
    // see: https://xrpl.org/parallel-networks.html
    if (shortcut === 'tXRP') {
        return 'XRP';
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
    readonly link: BlockchainLink;
    serverInfo?: ServerInfo;

    readonly identity?: string;
    readonly coinInfo: BlockchainOptions['coinInfo'];
    readonly postMessage: BlockchainOptions['postMessage'];

    private onDisconnected: BlockchainOptions['onDisconnected'];
    private initPromise?: Promise<ServerInfo>;

    private readonly proxy?: Proxy;
    private readonly debug?: boolean;

    // Optional dedicated backend for transactions the primary one does not know yet.
    private readonly broadcastConfig?: NonNullable<CoinInfo['blockchainLink']>['broadcast'];
    private broadcastLink?: BlockchainLink;

    constructor(options: BlockchainOptions) {
        this.identity = options.identity;
        this.coinInfo = options.coinInfo;
        this.postMessage = options.postMessage;
        this.onDisconnected = options.onDisconnected;
        this.proxy = options.proxy;
        this.debug = options.debug;

        const { blockchainLink } = options.coinInfo;
        if (!blockchainLink) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }

        this.broadcastConfig = blockchainLink.broadcast;

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
            // register EVM and Tron blocks once per 12+ seconds
            ...(this.coinInfo.type === 'ethereum' ||
            ['TRX', 'tTRX'].includes(this.coinInfo.shortcut)
                ? { throttleBlockEvent: 12 * 1000 }
                : {}),
            ...(['ripple', 'stellar'].includes(blockchainLink.type)
                ? { throttleBlockEvent: 60 * 1000 }
                : {}),
        });
    }

    private onBackendDisconnected(pendingSubscriptions = false) {
        this.postMessage(
            createBlockchainMessage(BLOCKCHAIN.ERROR, {
                coin: this.coinInfo,
                identity: this.identity,
                error: ERRORS.ERROR_CODES.Backend_Disconnected,
                code: 'Backend_Disconnected',
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

        const trezorNetworkShortcut = getNormalizedTrezorShortcut(this.coinInfo.shortcut);
        const backendNetworkShortcut = this.serverInfo.network;

        if (backendNetworkShortcut.toLowerCase() !== trezorNetworkShortcut.toLowerCase()) {
            throw ERRORS.TypedError('Backend_Invalid');
        }

        this.link.on('disconnected', () => {
            const pendingSubscriptions =
                this.link.listenerCount('block') ||
                this.link.listenerCount('notification') ||
                this.link.listenerCount('fiatRates');

            this.link.dispose();
            this.onBackendDisconnected(!!pendingSubscriptions);
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

    // The broadcast backend knows a transaction from the moment it is sent, the primary one only
    // once it indexes it, so a lookup the primary backend cannot answer is retried there.
    private getTransaction(params: { txid: string; descriptor?: string }) {
        return this.link.getTransaction(params).catch(error => {
            const broadcastLink = this.getBroadcastLink();
            if (!broadcastLink) {
                throw error;
            }

            // Report the primary backend error, the broadcast backend is only a fallback here.
            return broadcastLink.getTransaction(params).catch(() => {
                throw error;
            });
        });
    }

    getTransactions(txs: string[], descriptor?: string) {
        return Promise.all(txs.map(txid => this.getTransaction({ txid, descriptor })));
    }

    getTransactionHexes(txids: string[]) {
        return Promise.all(txids.map(id => this.link.getTransactionHex(id)));
    }

    getCurrentFiatRates(params: { currencies?: string[]; token?: string }) {
        return this.link.getCurrentFiatRates(params);
    }

    getContractInfo(params: BlockchainLinkParams<'getContractInfo'>) {
        return this.link.getContractInfo(params);
    }

    getFiatRatesForTimestamps(params: {
        currencies?: string[];
        timestamps: number[];
        token?: string;
    }) {
        return this.link.getFiatRatesForTimestamps(params);
    }

    // Same canonical-descriptor requirement as `getAccountInfo` below.
    getAccountBalanceHistory(
        params: Omit<BlockchainLinkParams<'getAccountBalanceHistory'>, 'descriptor'> & {
            descriptor: CanonicalDescriptor;
        },
    ) {
        return this.link.getAccountBalanceHistory(params);
    }

    getNetworkInfo() {
        return this.link.getInfo();
    }

    // Blockbook rejects taproot descriptors that use `h` for hardened parts, so the descriptor sent
    // to the backend must be canonical (apostrophe form). The CanonicalDescriptor brand forces every
    // caller to normalize via `toCanonicalDescriptor`, turning that requirement into a compiler check.
    // The brand is not exhaustive: `getTransactions` and `subscribeAccounts`/`unsubscribeAccounts`
    // still take plain strings, so read it as a guarantee for the branded methods only.
    async getAccountInfo(
        request: Omit<BlockchainLinkParams<'getAccountInfo'>, 'descriptor'> & {
            descriptor: CanonicalDescriptor;
        },
    ) {
        const info = await this.link.getAccountInfo(request);
        const broadcastLink = this.getBroadcastLink();
        if (!broadcastLink) {
            return info;
        }

        const [broadcastNonce, broadcastTransactions] = await Promise.all([
            request.confirmedNonce
                ? this.getBroadcastConfirmedNonce(broadcastLink, request.descriptor)
                : undefined,
            this.getBroadcastPendingTransactions(broadcastLink, request, info),
        ]);

        return {
            ...info,
            history: broadcastTransactions.length
                ? {
                      ...info.history,
                      transactions: [
                          ...broadcastTransactions,
                          ...(info.history.transactions ?? []),
                      ],
                  }
                : info.history,
            misc:
                broadcastNonce === undefined
                    ? info.misc
                    : {
                          ...info.misc,
                          confirmedNonce: maxNonce(info.misc?.confirmedNonce, broadcastNonce),
                      },
        };
    }

    // The broadcast backend sees mined transactions before the primary one indexes them, so its
    // nonce can be ahead. A failure there must not block signing, the primary answer stands.
    private getBroadcastConfirmedNonce(broadcastLink: BlockchainLink, descriptor: string) {
        return broadcastLink
            .getAccountInfo({ descriptor, details: 'basic' })
            .then(info => info.misc?.nonce)
            .catch(() => undefined);
    }

    // Transactions sent through the broadcast backend may never reach the primary one while they
    // are pending, so without them the wallet would drop its own pending transactions as gone.
    private async getBroadcastPendingTransactions(
        broadcastLink: BlockchainLink,
        request: BlockchainLinkParams<'getAccountInfo'>,
        info: Awaited<ReturnType<BlockchainLink['getAccountInfo']>>,
    ) {
        const txids = request.privatePending?.txids;
        if (request.details !== 'txs' || (request.page ?? 1) !== 1 || !txids?.length) {
            return [];
        }

        const known = new Set(info.history.transactions?.map(tx => tx.txid.toLowerCase()));
        const missing = txids.filter(txid => !known.has(txid.toLowerCase()));

        const transactions = await Promise.all(
            missing.map(txid =>
                broadcastLink
                    .getTransaction({ txid, descriptor: request.descriptor })
                    .catch(() => undefined),
            ),
        );

        return transactions.filter(tx => tx !== undefined);
    }

    getAccountUtxo(descriptor: CanonicalDescriptor) {
        return this.link.getAccountUtxo(descriptor);
    }

    rpcCall(params: BlockchainLinkParams<'rpcCall'>) {
        return this.link.rpcCall(params);
    }

    estimateFee(request: Parameters<typeof this.link.estimateFee>[0]) {
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

    // Lazily create the broadcast link on first use so networks without a broadcast backend
    // never spawn a second worker.
    private getBroadcastLink() {
        if (!this.broadcastConfig?.url.length) {
            return undefined;
        }

        if (!this.broadcastLink) {
            const worker = getWorker(this.broadcastConfig.type);
            if (!worker) {
                throw ERRORS.TypedError(
                    'Backend_WorkerMissing',
                    `BlockchainLink broadcast worker not found ${this.broadcastConfig.type}`,
                );
            }

            this.broadcastLink = new BlockchainLink({
                name: `${this.coinInfo.shortcut}-broadcast`,
                worker,
                server: this.broadcastConfig.url,
                debug: this.debug,
                proxy: this.proxy,
            });
        }

        return this.broadcastLink;
    }

    pushTransaction(params: BlockchainLinkParams<'pushTransaction'>) {
        // Broadcast via the dedicated link when configured, fall back to the primary one otherwise.
        const link = this.getBroadcastLink() ?? this.link;

        return link.pushTransaction(params);
    }

    disconnect() {
        this.link.removeAllListeners();
        this.link
            .disconnect()
            .catch(() => {})
            .finally(() => this.link.dispose());

        const { broadcastLink } = this;
        if (broadcastLink) {
            broadcastLink
                .disconnect()
                .catch(() => {})
                .finally(() => broadcastLink.dispose());
        }

        this.onBackendDisconnected();
    }
}
