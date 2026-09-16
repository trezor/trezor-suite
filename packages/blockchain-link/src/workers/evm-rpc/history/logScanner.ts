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
};

export type BlockRange = { from: number; to: number };

type QueuedRange = BlockRange & { rateLimitRetries: number };

export type RpcErrorInfo = { code?: number; message: string };

const RANGE_TOO_LARGE = -32012;
const RATE_LIMIT_EXCEEDED = -32005;

export const padAddressTopic = (address: string): `0x${string}` =>
    `0x${address.replace(/^0x/, '').toLowerCase().padStart(64, '0')}`;

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
 * 10000 blocks are not supported on free plan`, `currently limited to 100 blocks`. Reading it beats
 * halving, because it converges in one step and to the right value.
 */
export const parseMaxRangeBlocks = (message: string): number | undefined => {
    const patterns = [
        /ranges?\s+over\s+(\d+)\s+blocks?\s+(?:are|is)\s+not\s+supported/i,
        /limited to\s+(\d+)\s+blocks?/i,
        /max(?:imum)?\s+block\s+range\s*(?:is|of|:)?\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);
        const blocks = match ? Number(match[1]) : NaN;

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
    let current: unknown = error;

    for (let depth = 0; current && depth < 5; depth++) {
        const candidate = current as { code?: unknown; message?: unknown; cause?: unknown };
        if (code === undefined && typeof candidate.code === 'number') {
            code = candidate.code;
        }
        if (typeof candidate.message === 'string') {
            messages.push(candidate.message);
        }
        current = candidate.cause;
    }

    return { code, message: messages.join(' | ') };
};

const isRangeTooLarge = ({ code, message }: RpcErrorInfo) =>
    code === RANGE_TOO_LARGE ||
    /range too large|exceed\w* max(imum)? block range|ranges? over \d+ blocks?/i.test(message);

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

const isRateLimited = ({ code, message }: RpcErrorInfo) =>
    code === RATE_LIMIT_EXCEEDED || /rate limit/i.test(message);

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

    const runner = async () => {
        for (let next = pending.pop(); next; next = pending.pop()) {
            const chunk = next;
            const { topics } = chunk;
            try {
                logs.push(...(await requestLogs(client, chunk, topics)));
            } catch (error) {
                const info = getRpcErrorInfo(error);

                const suggested = parseSuggestedRange(info.message);
                if (suggested && suggested.to < chunk.to && suggested.from <= suggested.to) {
                    pending.push(
                        { ...suggested, rateLimitRetries: 0, topics },
                        { from: suggested.to + 1, to: chunk.to, rateLimitRetries: 0, topics },
                    );
                    continue;
                }

                if (isRateLimited(info) && chunk.rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
                    const attempt = chunk.rateLimitRetries + 1;
                    await resolveAfter(RATE_LIMIT_BACKOFF_MS * attempt);
                    pending.push({ ...chunk, rateLimitRetries: attempt });
                    continue;
                }

                const span = chunk.to - chunk.from + 1;

                // A provider that names its cap gets taken at its word; one that only complains
                // gets halved until it stops complaining.
                const cap = parseMaxRangeBlocks(info.message);
                if (cap !== undefined && cap < span) {
                    applyChunkCap(cap);
                    pending.push(...withTopics(splitIntoChunks(chunk, cap), topics));
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

    await Promise.all(
        Array.from({ length: Math.min(MAX_LOG_CONCURRENCY, pending.length) }, runner),
    );

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
    const watched = (typeof addresses === 'string' ? [addresses] : addresses).map(padAddressTopic);

    if (range.from > range.to || !watched.length) {
        return { logs: [], complete: true, failed: [] };
    }

    const topic: LogTopic = watched.length === 1 ? (watched[0] as `0x${string}`) : watched;
    const chunks = splitIntoChunks(range, getEffectiveChunkSize(client, chunkSize));

    return await scanQueue(client, [
        ...withTopics(chunks, [TRANSFER_TOPIC, topic]),
        ...withTopics(chunks, [TRANSFER_TOPIC, null, topic]),
    ]);
};
