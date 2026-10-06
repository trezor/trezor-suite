import { BlockchainLink } from '@trezor/blockchain-link';
import { err, ok } from '@trezor/type-utils';

import type { Backend, BackendError } from './backend';
import { type DiagnosticDetails, diagnosticLog } from '../app/diagnosticLog';
import { BLOCKBOOK_URLS } from '../bitcoin/bitcoinNetwork';

const toBackendError = (error: unknown): BackendError => ({
    type: 'backend',
    message: error instanceof Error ? error.message : 'Unknown backend error',
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

export type BlockbookBackend = Backend & {
    dispose: () => void;
};

/**
 * Connects to Trezor's Bitcoin blockbook over WebSocket. The blockbook worker of
 * @trezor/blockchain-link is loaded as a plain module and runs in the main thread, so no
 * account data ever crosses a worker boundary.
 */
export const createBlockbookBackend = (): BlockbookBackend => {
    const link = new BlockchainLink({
        name: 'Bitcoin',
        worker: () =>
            import('@trezor/blockchain-link/src/workers/blockbook').then(module =>
                module.default(),
            ),
        server: BLOCKBOOK_URLS,
        debug: false,
    });

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
        pushTransaction: hex =>
            settle({
                request: link.pushTransaction({ hex }),
                method: 'pushTransaction',
                target: `${hex.length / 2} bytes`,
                summarize: () => ({}),
            }),
        dispose: () => {
            link.dispose();
        },
    };
};
