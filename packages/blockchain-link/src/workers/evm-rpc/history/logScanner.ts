import type { LogTopic, PublicClient } from 'viem';

import { resolveAfter } from '@trezor/utils';

import {
    LOG_CHUNK_BLOCKS,
    MAX_LOG_CONCURRENCY,
    MAX_RATE_LIMIT_RETRIES,
    MIN_LOG_CHUNK_BLOCKS,
    RATE_LIMIT_BACKOFF_MS,
    TRANSFER_TOPIC,
} from './constants';
import { getErrorName } from '../utils/errors';

export type RawLog = {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    /** Non-standard, but Arc returns it, which saves a getBlock per block just for the timestamp. */
    blockTimestamp?: string;
    /** Set on a log a subscription withdraws after a reorg. */
    removed?: boolean;
};

export type BlockRange = { from: number; to: number };

type QueuedRange = BlockRange & { rateLimitRetries: number };

export type RpcErrorInfo = { code?: number; status?: number; message: string };

const RANGE_TOO_LARGE = -32012;
const RATE_LIMIT_EXCEEDED = -32005;
const HTTP_TOO_MANY_REQUESTS = 429;

export const padAddressTopic = (address: string): `0x${string}` =>
    `0x${address.replace(/^0x/, '').toLowerCase().padStart(64, '0')}`;

/** A topic position accepts alternatives, so any number of addresses fit in one filter. */
export const toAddressTopic = (addresses: readonly string[]): LogTopic => {
    const topics = addresses.map(padAddressTopic);

    return topics.length === 1 ? (topics[0] as `0x${string}`) : topics;
};

/**
 * Providers that cap results rather than range answer with the widest range they would have
 * accepted, which beats blindly halving: `query exceeds max results 20000, retry with the range
 * 59066104-59066970`.
 */
export const parseSuggestedRange = (message: string): BlockRange | undefined => {
    const match = /retry with the range\s+(\d+)\s*-\s*(\d+)/i.exec(message);
    if (!match) return undefined;

    const from = Number(match[1]);
    const to = Number(match[2]);

    return Number.isSafeInteger(from) && Number.isSafeInteger(to) && from <= to
        ? { from, to }
        : undefined;
};

/**
 * Some providers name their block-range cap in the error instead of just rejecting: `ranges over
 * 10000 blocks are not supported on free plan`, `eth_getLogs is limited to a 10,000 range`. Reading
 * it beats halving, because it converges in one step and to the right value.
 */
export const parseMaxRangeBlocks = (message: string): number | undefined => {
    const patterns = [
        /ranges?\s+over\s+(\d+)\s+blocks?\s+(?:are|is)\s+not\s+supported/i,
        /limited to\s+(?:a\s+)?([\d,]+)\s+(?:blocks?|range)/i,
        /max(?:imum)?\s+block\s+range\s*(?:is|of|:)?\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);
        const blocks = match ? Number(match[1]?.replace(/,/g, '')) : NaN;

        if (Number.isSafeInteger(blocks) && blocks > 0) {
            return blocks;
        }
    }

    return undefined;
};

/** viem nests the JSON-RPC error, and how deeply depends on the transport. */
export const getRpcErrorInfo = (error: unknown): RpcErrorInfo => {
    const messages: string[] = [];
    let code: number | undefined;
    let status: number | undefined;
    let current: unknown = error;

    for (let depth = 0; current && depth < 5; depth++) {
        const candidate = current as {
            code?: unknown;
            status?: unknown;
            message?: unknown;
            cause?: unknown;
        };
        if (code === undefined && typeof candidate.code === 'number') {
            code = candidate.code;
        }
        if (status === undefined && typeof candidate.status === 'number') {
            status = candidate.status;
        }
        if (typeof candidate.message === 'string') {
            messages.push(candidate.message);
        }
        current = candidate.cause;
    }

    return { code, status, message: messages.join(' | ') };
};

const RANGE_TOO_LARGE_MESSAGE =
    /range too large|exceed\w* max(imum)? block range|ranges? over \d+ blocks?|limited to a [\d,]+ range/i;

const isRangeTooLarge = ({ code, message }: RpcErrorInfo) =>
    code === RANGE_TOO_LARGE || RANGE_TOO_LARGE_MESSAGE.test(message);

// A provider's range cap is a property of the endpoint (and its plan), not of one query, so it is
// worth remembering for the rest of the connection instead of rediscovering it per chunk.
const learnedChunkCaps = new WeakMap<PublicClient, number>();

const getEffectiveChunkSize = (client: PublicClient, requested: number) =>
    Math.max(1, Math.min(requested, learnedChunkCaps.get(client) ?? requested));

const learnChunkCap = (client: PublicClient, blocks: number) => {
    const known = learnedChunkCaps.get(client);

    if (known === undefined || blocks < known) {
        learnedChunkCaps.set(client, blocks);
    }
};

// A batched request turned away at the HTTP level fails every query it carried at once, so a 429
// has to back off like a JSON-RPC rate limit rather than abandon the whole batch.
const isRateLimited = ({ code, status, message }: RpcErrorInfo) =>
    code === RATE_LIMIT_EXCEEDED ||
    status === HTTP_TOO_MANY_REQUESTS ||
    /rate limit/i.test(message);

const splitIntoChunks = (range: BlockRange, chunkSize: number): QueuedRange[] => {
    const chunks: QueuedRange[] = [];
    for (let { from } = range; from <= range.to; from += chunkSize) {
        chunks.push({
            from,
            to: Math.min(from + chunkSize - 1, range.to),
            rateLimitRetries: 0,
        });
    }

    return chunks;
};

const requestLogs = async (
    client: PublicClient,
    range: BlockRange,
    topics: LogTopic[],
): Promise<RawLog[]> => {
    const logs = await client.request({
        method: 'eth_getLogs',
        params: [
            {
                fromBlock: `0x${range.from.toString(16)}`,
                toBlock: `0x${range.to.toString(16)}`,
                topics,
            },
        ],
    });

    // Requested raw rather than through viem's getLogs so JSON-RPC error codes survive intact and
    // so `blockTimestamp` - which viem's log formatter drops - stays available.
    return logs as RawLog[];
};

type ScanResult = {
    logs: RawLog[];
    /** False when any sub-range was abandoned, so the caller must not mark the range as scanned. */
    complete: boolean;
    /** Sub-ranges that were given up on, so the caller can still claim the rest. */
    failed: BlockRange[];
};

type WorkItem = QueuedRange & { topics: LogTopic[] };

const withTopics = (ranges: QueuedRange[], topics: LogTopic[]): WorkItem[] =>
    ranges.map(range => ({ ...range, topics }));

/**
 * Drains one shared queue, so the concurrency cap covers the whole scan rather than each topic
 * position separately. Provoking the provider's own rate limiter is the expensive failure here:
 * it costs retries, and a range that runs out of them is one the caller cannot claim as scanned.
 */
const scanQueue = async (client: PublicClient, pending: WorkItem[]): Promise<ScanResult> => {
    const logs: RawLog[] = [];
    const failed: BlockRange[] = [];

    // Re-splitting everything still queued means one rejection teaches the whole scan, instead of
    // every oversized chunk having to be rejected on its own first.
    const applyChunkCap = (cap: number) => {
        learnChunkCap(client, cap);
        const oversized = pending.filter(chunk => chunk.to - chunk.from + 1 > cap);
        oversized.forEach(chunk => {
            pending.splice(pending.indexOf(chunk), 1);
            pending.push(...withTopics(splitIntoChunks(chunk, cap), chunk.topics));
        });
    };

    const runner = async (onRequeued: () => void) => {
        for (let next = pending.pop(); next; next = pending.pop()) {
            const chunk = next;
            const { topics } = chunk;
            try {
                logs.push(...(await requestLogs(client, chunk, topics)));
            } catch (error) {
                const info = getRpcErrorInfo(error);

                const suggested = parseSuggestedRange(info.message);
                // Only the suggested end is trusted: a start past `chunk.from` would leave a hole.
                if (suggested && suggested.to >= chunk.from && suggested.to < chunk.to) {
                    pending.push(
                        { from: chunk.from, to: suggested.to, rateLimitRetries: 0, topics },
                        { from: suggested.to + 1, to: chunk.to, rateLimitRetries: 0, topics },
                    );
                    onRequeued();
                    continue;
                }

                if (isRateLimited(info) && chunk.rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
                    const attempt = chunk.rateLimitRetries + 1;
                    await resolveAfter(RATE_LIMIT_BACKOFF_MS * attempt);
                    pending.push({ ...chunk, rateLimitRetries: attempt });
                    onRequeued();
                    continue;
                }

                const span = chunk.to - chunk.from + 1;

                // A provider that names its cap gets taken at its word, but only when the number
                // it names actually cuts the range. Observed on Arc: it refuses ~9950 blocks while
                // naming 10000 as the limit, so a cap derived from that name shaves a block off
                // per round trip and takes thousands of requests to converge. Anything that does
                // not shorten the range by at least the smallest chunk worth retrying is treated
                // as no cap at all, and halving - which converges in a handful of steps - takes
                // over instead.
                const named = parseMaxRangeBlocks(info.message);
                const cap =
                    named !== undefined && named <= span - MIN_LOG_CHUNK_BLOCKS ? named : undefined;
                if (cap !== undefined && cap > 0) {
                    applyChunkCap(cap);
                    pending.push(...withTopics(splitIntoChunks(chunk, cap), topics));
                    onRequeued();
                    continue;
                }

                if (isRangeTooLarge(info) && span > MIN_LOG_CHUNK_BLOCKS) {
                    const half = Math.floor(span / 2);
                    applyChunkCap(half);
                    pending.push(
                        {
                            from: chunk.from,
                            to: chunk.from + half - 1,
                            rateLimitRetries: 0,
                            topics,
                        },
                        { from: chunk.from + half, to: chunk.to, rateLimitRetries: 0, topics },
                    );
                    onRequeued();
                    continue;
                }

                console.warn(
                    `[evm-rpc] Abandoned log range ${chunk.from}-${chunk.to}:`,
                    getErrorName(error),
                );
                failed.push({ from: chunk.from, to: chunk.to });
            }
        }
    };

    const runners: Promise<void>[] = [];
    let active = 0;

    // Splits and retries put work back on the queue. Idle capacity picks it up at once, so it joins
    // the batch about to go out instead of waiting a round trip behind the runner that queued it.
    const startRunners = () => {
        while (active < MAX_LOG_CONCURRENCY && pending.length) {
            active++;
            runners.push(
                runner(startRunners).finally(() => {
                    active--;
                }),
            );
        }
    };

    startRunners();
    while (runners.length) {
        await Promise.all(runners.splice(0));
    }

    return { logs, complete: !failed.length, failed };
};

/**
 * Every `Transfer` touching any of `addresses` in `range`, in two passes (as sender, as recipient).
 * No address filter, so one pass covers every token plus whatever contract the chain uses to mirror
 * native transfers. A topic position accepts alternatives, so watching many accounts costs the same
 * two queries as watching one.
 */
export const scanTransferLogs = async (
    client: PublicClient,
    addresses: string | readonly string[],
    range: BlockRange,
    chunkSize = LOG_CHUNK_BLOCKS,
): Promise<ScanResult> => {
    const watched = typeof addresses === 'string' ? [addresses] : addresses;

    if (range.from > range.to || !watched.length) {
        return { logs: [], complete: true, failed: [] };
    }

    const topic = toAddressTopic(watched);
    const chunks = splitIntoChunks(range, getEffectiveChunkSize(client, chunkSize));

    return await scanQueue(client, [
        ...withTopics(chunks, [TRANSFER_TOPIC, topic]),
        ...withTopics(chunks, [TRANSFER_TOPIC, null, topic]),
    ]);
};
