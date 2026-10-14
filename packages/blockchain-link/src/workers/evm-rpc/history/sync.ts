import type { PublicClient } from 'viem';

import { INITIAL_HISTORY_BLOCKS, MAX_DISCOVERED_TOKENS, TIP_LAG_BLOCKS } from './constants';
import { type BlockRange, type RawLog, scanTransferLogs } from './logScanner';
import { getNativeLogSources } from './nativeAsset';
import {
    type DescriptorHistory,
    forgetOwnTxid,
    getDescriptorHistory,
    getOwnTxids,
    isCold,
} from './state';
import { parseTransferLog } from './transferLog';
import type { WorkerState } from '../../state';
import { isSameAddress } from '../utils/address';
import { toHex } from '../utils/hex';

type SyncParams = {
    client: PublicClient;
    state: WorkerState;
    descriptor: string;
    /** Oldest block the caller wants covered, used by "load older transactions". */
    fromBlock?: number;
};

const toNumber = (quantity: string | undefined) => {
    if (!quantity) return undefined;
    const parsed = Number(quantity);

    return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const ingestLogs = (
    history: DescriptorHistory,
    logs: readonly RawLog[],
    nativeAddresses: ReadonlySet<string>,
) => {
    logs.forEach(log => {
        const transfer = parseTransferLog(log);
        const blockNumber = toNumber(log.blockNumber);
        const transactionIndex = toNumber(log.transactionIndex);

        if (!transfer || blockNumber === undefined || transactionIndex === undefined) return;

        const txid = log.transactionHash.toLowerCase();
        const known = history.entries.get(txid);

        history.entries.set(txid, {
            txid,
            blockNumber,
            transactionIndex,
            blockTimestamp: toNumber(log.blockTimestamp) ?? known?.blockTimestamp,
        });

        if (
            !nativeAddresses.has(transfer.contract) &&
            history.tokenContracts.size < MAX_DISCOVERED_TOKENS
        ) {
            history.tokenContracts.add(transfer.contract);
        }
    });
};

/**
 * A transfer-log scan cannot see a transaction that moved nothing - an approval, a failed call - so
 * transactions this worker broadcast are resolved by receipt instead. Without this the account's
 * own send silently vanishes when Suite drops its locally-held pending copy.
 */
const resolveOwnTransactions = async (
    client: PublicClient,
    state: WorkerState,
    history: DescriptorHistory,
    descriptor: string,
) => {
    const unresolved = getOwnTxids(state).filter(txid => {
        if (history.entries.has(txid)) {
            forgetOwnTxid(state, txid);

            return false;
        }

        return true;
    });

    await Promise.all(
        unresolved.map(async txid => {
            try {
                const receipt = await client.getTransactionReceipt({ hash: toHex(txid) });
                const blockNumber = Number(receipt.blockNumber);

                if (!Number.isSafeInteger(blockNumber)) return;

                if (
                    !isSameAddress(receipt.from, descriptor) &&
                    !isSameAddress(receipt.to, descriptor)
                ) {
                    return;
                }

                history.entries.set(txid, {
                    txid,
                    blockNumber,
                    transactionIndex: receipt.transactionIndex,
                });
                forgetOwnTxid(state, txid);
            } catch {
                // Not mined yet, or dropped. Either way it stays queued for the next sync.
            }
        }),
    );
};

/**
 * Only ever covers what was asked for: it catches up on blocks mined since the last sync, and
 * reaches further back only when `fromBlock` says so. History is pulled by the account view rather
 * than loaded up front, because a scan is the one genuinely expensive thing this backend does.
 */
export const syncHistory = async ({
    client,
    state,
    descriptor,
    fromBlock,
}: SyncParams): Promise<DescriptorHistory> => {
    const history = getDescriptorHistory(state, descriptor);
    const wasCold = isCold(history);

    const latest = Number(await client.getBlockNumber());
    const windowStart = Math.max(0, latest - INITIAL_HISTORY_BLOCKS + 1);
    type ScanTask = { kind: 'cold' | 'forward' | 'backward'; range: BlockRange };
    const tasks: ScanTask[] = [];

    if (wasCold) {
        tasks.push({
            kind: 'cold',
            range: {
                from: Math.max(0, Math.min(fromBlock ?? windowStart, windowStart)),
                to: latest,
            },
        });
    } else {
        if (latest > history.syncedTo) {
            tasks.push({ kind: 'forward', range: { from: history.syncedTo + 1, to: latest } });
        }
        if (fromBlock !== undefined && fromBlock < history.syncedFrom) {
            tasks.push({
                kind: 'backward',
                range: { from: Math.max(0, fromBlock), to: history.syncedFrom - 1 },
            });
        }
    }

    const nativeSources = await getNativeLogSources(client);
    const nativeAddresses = new Set(nativeSources.map(source => source.address.toLowerCase()));

    const results = await Promise.all(
        tasks.map(task => scanTransferLogs(client, descriptor, task.range)),
    );

    results.forEach(result => ingestLogs(history, result.logs, nativeAddresses));
    await resolveOwnTransactions(client, state, history, descriptor);

    // Bounds promise that everything inside them has been seen, so they may only ever cover a
    // contiguous fully-scanned region. Claiming whatever did succeed is what keeps a single
    // abandoned chunk from condemning the account to rescanning its whole window forever.
    const claimable = latest - TIP_LAG_BLOCKS;

    tasks.forEach(({ kind, range }, index) => {
        const { failed } = results[index] ?? { failed: [] };
        const lowestFailure = failed.length ? Math.min(...failed.map(gap => gap.from)) : undefined;
        const highestFailure = failed.length ? Math.max(...failed.map(gap => gap.to)) : undefined;

        if (kind === 'forward') {
            // Must stay contiguous with what is already covered below, so it can only grow up to
            // the first gap.
            const reached = Math.min(
                lowestFailure !== undefined ? lowestFailure - 1 : latest,
                claimable,
            );
            history.syncedTo = Math.max(history.syncedTo, reached);

            return;
        }

        // A cold or backward scan is anchored at its top, so the covered part is whatever sits
        // above the last gap.
        const from = highestFailure !== undefined ? highestFailure + 1 : range.from;

        if (kind === 'backward') {
            if (from < history.syncedFrom) {
                history.syncedFrom = from;
            }

            return;
        }

        if (from <= claimable) {
            history.syncedFrom = from;
            history.syncedTo = claimable;
        }
    });

    return history;
};
