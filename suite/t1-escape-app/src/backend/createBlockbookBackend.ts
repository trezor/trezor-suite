import { BlockchainLink } from '@trezor/blockchain-link';
import { err, ok } from '@trezor/type-utils';

import type { Backend, BackendError, EthereumBackend } from './backend';
import { type DiagnosticDetails, diagnosticLog } from '../app/diagnosticLog';
import { BLOCKBOOK_URLS } from '../bitcoin/bitcoinNetwork';
import {
    ETHEREUM_CHAINS,
    ETHEREUM_CHAIN_DEFINITIONS,
    type EthereumChain,
} from '../ethereum/ethereumChain';

// A node quotes what it refuses: an address ("insufficient funds ... address 0x... have ..."),
// a transaction id, a descriptor or an amount. None of it belongs in the log or on the screen.
const CONFIDENTIAL_MESSAGE_PARTS = [
    /0x[0-9a-fA-F]{6,}/g,
    /\b[0-9a-fA-F]{32,}\b/g,
    /\b[xyz]pub[1-9A-HJ-NP-Za-km-z]{20,}\b/g,
    /\b(?:bc1[02-9ac-hj-np-z]{20,}|[13][1-9A-HJ-NP-Za-km-z]{25,})\b/g,
    /\b\d{6,}\b/g,
];

export const redactBackendMessage = (message: string) =>
    CONFIDENTIAL_MESSAGE_PARTS.reduce((redacted, part) => redacted.replace(part, '…'), message);

const toBackendError = (error: unknown): BackendError => ({
    type: 'backend',
    message: error instanceof Error ? redactBackendMessage(error.message) : 'Unknown backend error',
});

// Descriptors and transaction ids are confidential, the log only tells what kind was asked.
const describeDescriptor = (descriptor: string) =>
    /^[xyz]pub/.test(descriptor) ? `${descriptor.slice(0, 4)} account` : 'address';

type SettleParams<T> = {
    request: Promise<T>;
    method: string;
    target: string;
    summarize: (payload: T) => DiagnosticDetails;
};

const settle = async <T>({ request, method, target, summarize }: SettleParams<T>) => {
    diagnosticLog.info('backend', `${method} ${target}`);
    const startedAt = Date.now();

    try {
        const payload = await request;
        diagnosticLog.info('backend', `${method} ok`, {
            durationMs: Date.now() - startedAt,
            ...summarize(payload),
        });

        return ok(payload);
    } catch (error) {
        const backendError = toBackendError(error);
        diagnosticLog.error('backend', `${method} failed`, {
            durationMs: Date.now() - startedAt,
            message: backendError.message,
        });

        return err(backendError);
    }
};

const loadBlockbookWorker = () =>
    import('@trezor/blockchain-link/src/workers/blockbook').then(module => module.default());

type DisposableEthereumBackend = EthereumBackend & {
    dispose: () => void;
};

/** One Ethereum-like blockbook. Addresses, amounts and ids never reach the log. */
const createEthereumBlockbookBackend = (chain: EthereumChain): DisposableEthereumBackend => {
    const { label, symbol, blockbookUrl } = ETHEREUM_CHAIN_DEFINITIONS[chain];
    const link = new BlockchainLink({
        name: label,
        worker: loadBlockbookWorker,
        server: [blockbookUrl],
        debug: false,
    });

    return {
        getAccountInfo: address =>
            settle({
                request: link.getAccountInfo({ descriptor: address, details: 'tokenBalances' }),
                method: `${symbol} getAccountInfo`,
                target: 'address',
                summarize: info => ({
                    empty: info.empty,
                    transactions: info.history.total,
                    unconfirmed: info.history.unconfirmed,
                    hasNonce: info.misc?.nonce !== undefined,
                    tokens: info.tokens?.length ?? 0,
                }),
            }),
        estimateGasPrice: () =>
            settle({
                // The gas price is a property of the network, not of the account.
                request: link.estimateFee({ blocks: [1] }).then(levels => {
                    const [level] = levels;
                    if (!level) throw new Error('no fee level returned');

                    return level.feePerUnit;
                }),
                method: `${symbol} estimateFee`,
                target: 'next block',
                summarize: feePerUnit => ({ feePerUnit }),
            }),
        getTransaction: txid =>
            settle({
                request: link.getTransaction({ txid }),
                method: `${symbol} getTransaction`,
                target: 'transaction',
                summarize: transaction => ({
                    blockHeight: transaction.blockHeight,
                    status: transaction.ethereumSpecific?.status,
                }),
            }),
        dispose: () => {
            link.dispose();
        },
    };
};

export type BlockbookBackend = Backend & {
    dispose: () => void;
};

/**
 * Connects to Trezor's blockbooks over WebSocket. The blockbook worker of @trezor/blockchain-link
 * is loaded as a plain module and runs in the main thread, so no account data ever crosses a
 * worker boundary. Each chain gets its own connection, opened on first use.
 */
export const createBlockbookBackend = (): BlockbookBackend => {
    const link = new BlockchainLink({
        name: 'Bitcoin',
        worker: loadBlockbookWorker,
        server: BLOCKBOOK_URLS,
        debug: false,
    });
    const ethereum = Object.fromEntries(
        ETHEREUM_CHAINS.map(chain => [chain, createEthereumBlockbookBackend(chain)]),
    ) as Record<EthereumChain, DisposableEthereumBackend>;

    return {
        getAccountInfo: params =>
            settle({
                request: link.getAccountInfo(params),
                method: 'getAccountInfo',
                target: `${describeDescriptor(params.descriptor)} gap=${params.gap ?? 'default'} details=${params.details ?? 'basic'}`,
                summarize: info => ({
                    empty: info.empty,
                    transactions: info.history.total,
                    unconfirmed: info.history.unconfirmed,
                    returnedTransactions: info.history.transactions?.length ?? 0,
                    usedAddresses: info.addresses?.used.length ?? 0,
                    unusedAddresses: info.addresses?.unused.length ?? 0,
                    changeAddresses: info.addresses?.change.length ?? 0,
                }),
            }),
        getAccountUtxo: descriptor =>
            settle({
                request: link.getAccountUtxo(descriptor),
                method: 'getAccountUtxo',
                target: describeDescriptor(descriptor),
                summarize: utxos => ({ outputs: utxos.length }),
            }),
        getTransactionHex: txid =>
            settle({
                request: link.getTransactionHex(txid),
                method: 'getTransactionHex',
                target: 'transaction',
                summarize: hex => ({ bytes: hex.length / 2 }),
            }),
        ethereum,
        dispose: () => {
            link.dispose();
            Object.values(ethereum).forEach(backend => backend.dispose());
        },
    };
};
