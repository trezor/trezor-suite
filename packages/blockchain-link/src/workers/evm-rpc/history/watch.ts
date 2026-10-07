import type { PublicClient } from 'viem';

import type { Transaction } from '@trezor/blockchain-link-types';

import { mapEntries } from './getHistory';
import { type RawLog, scanTransferLogs } from './logScanner';
import { getNativeLogSources } from './nativeAsset';
import { discoverTokenContract, getDescriptorHistory, isCold } from './state';
import { parseTransferLog } from './transferLog';
import type { WorkerState } from '../../state';
import { isSameAddress } from '../utils/address';

export type AccountChange = {
    descriptor: string;
    /** Newest transaction found for this account, already mapped from its perspective. */
    tx: Transaction;
};

export type AccountChanges = {
    changes: AccountChange[];
    /** Highest block up to which nothing was missed: stops short of the first abandoned chunk. */
    checkedTo: number;
};

// Accounts are subscribed only while someone looks at them, so whatever was mined since they were
// last synced or watched has not been seen yet. Cold accounts have nothing to catch up on: their
// first sync scans the recent window anyway.
export const getCatchUpStart = (state: WorkerState, latestBlock: number) =>
    Math.min(
        latestBlock,
        ...state
            .getAccounts()
            .map(account => getDescriptorHistory(state, account.descriptor))
            .filter(history => !isCold(history))
            .map(history => Math.max(history.syncedTo, history.watchedTo)),
    );

/**
 * Records that no change for the watched accounts went unnoticed up to `coveredTo`, so watching
 * that stops and starts again picks up there rather than rescanning since the last sync. Callers
 * leave the tip out, as its logs may not be queryable yet.
 */
export const markWatched = (state: WorkerState, coveredTo: number) => {
    state.getAccounts().forEach(({ descriptor }) => {
        const history = getDescriptorHistory(state, descriptor);
        history.watchedTo = Math.max(history.watchedTo, coveredTo);
    });
};

/**
 * Ingests transfer logs touching the watched accounts, however they were obtained, and reports the
 * newest transaction each account had not known about.
 */
export const reportAccountChanges = async (
    client: PublicClient,
    state: WorkerState,
    logs: readonly RawLog[],
): Promise<AccountChange[]> => {
    const watched = state.getAccounts();

    if (!logs.length || !watched.length) {
        return [];
    }

    const nativeSources = await getNativeLogSources(client);
    const nativeAddresses = new Set(nativeSources.map(source => source.address.toLowerCase()));

    const freshByDescriptor = new Map<string, string[]>();

    logs.forEach(log => {
        const transfer = parseTransferLog(log);
        const blockNumber = Number(log.blockNumber);
        const transactionIndex = Number(log.transactionIndex);

        if (
            !transfer ||
            !Number.isSafeInteger(blockNumber) ||
            !Number.isSafeInteger(transactionIndex)
        ) {
            return;
        }

        const txid = log.transactionHash.toLowerCase();

        watched.forEach(({ descriptor }) => {
            if (
                !isSameAddress(transfer.from, descriptor) &&
                !isSameAddress(transfer.to, descriptor)
            ) {
                return;
            }

            const history = getDescriptorHistory(state, descriptor);
            const isNew = !history.entries.has(txid);

            history.entries.set(txid, {
                txid,
                blockNumber,
                transactionIndex,
                blockTimestamp: log.blockTimestamp ? Number(log.blockTimestamp) : undefined,
            });

            discoverTokenContract(history, transfer, nativeAddresses);

            if (isNew) {
                freshByDescriptor.set(descriptor, [
                    ...(freshByDescriptor.get(descriptor) ?? []),
                    txid,
                ]);
            }
        });
    });

    const changes = await Promise.all(
        [...freshByDescriptor.entries()].map(async ([descriptor, txids]) => {
            const history = getDescriptorHistory(state, descriptor);
            const newest = txids
                .map(txid => history.entries.get(txid))
                .filter(entry => entry !== undefined)
                .sort(
                    (a, b) =>
                        b.blockNumber - a.blockNumber || b.transactionIndex - a.transactionIndex,
                )
                .at(0);

            if (!newest) return undefined;

            const [tx] = await mapEntries({ client, descriptor, entries: [newest] });

            return tx ? { descriptor, tx } : undefined;
        }),
    );

    return changes.filter((change): change is AccountChange => change !== undefined);
};

/**
 * Looks for transfers involving any subscribed account since the last check.
 *
 * Deliberately does not advance the per-descriptor scanned bounds: this is a change detector, and
 * leaving the bounds alone keeps their "everything in here has been seen" meaning owned solely by
 * `syncHistory`. Ingesting is idempotent, so the next sync re-reading the same blocks costs nothing.
 */
export const detectAccountChanges = async (
    client: PublicClient,
    state: WorkerState,
    fromBlock: number,
    latestBlock: number,
): Promise<AccountChanges> => {
    const watched = state.getAccounts();

    if (!watched.length || fromBlock > latestBlock) {
        return { changes: [], checkedTo: latestBlock };
    }

    // One pair of queries for every watched account, not per account.
    const { logs, failed } = await scanTransferLogs(
        client,
        watched.map(account => account.descriptor),
        { from: fromBlock, to: latestBlock },
    );
    const checkedTo = failed.length ? Math.min(...failed.map(gap => gap.from)) - 1 : latestBlock;
    markWatched(state, checkedTo);

    return { changes: await reportAccountChanges(client, state, logs), checkedTo };
};
