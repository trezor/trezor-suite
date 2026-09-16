import type { PublicClient } from 'viem';

import { MAX_LOG_CONCURRENCY, TRANSFER_TOPIC } from './constants';
import {
    getRpcErrorInfo,
    padAddressTopic,
    parseMaxRangeBlocks,
    parseSuggestedRange,
    scanTransferLogs,
} from './logScanner';

const ADDRESS = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';

const log = (blockNumber: number) => ({
    address: '0x3600000000000000000000000000000000000000',
    topics: [TRANSFER_TOPIC, padAddressTopic(ADDRESS), padAddressTopic(ADDRESS)],
    data: `0x${'0'.repeat(63)}1`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
    transactionIndex: '0x0',
});

type RequestParams = [{ fromBlock: string; toBlock: string }];

const rpcError = (code: number, message: string) => Object.assign(new Error(message), { code });

const createClient = (request: jest.Mock) => ({
    client: { request } as unknown as PublicClient,
    ranges: (): [number, number][] =>
        request.mock.calls.map(([{ params }]: [{ params: RequestParams }]) => [
            Number(params[0].fromBlock),
            Number(params[0].toBlock),
        ]),
});

describe(padAddressTopic.name, () => {
    it('left-pads a lowercased address to 32 bytes', () => {
        expect(padAddressTopic(ADDRESS)).toBe(
            `0x${'0'.repeat(24)}${ADDRESS.slice(2).toLowerCase()}`,
        );
    });
});

describe(parseSuggestedRange.name, () => {
    it('reads the range a result-capped provider asks to be retried with', () => {
        expect(
            parseSuggestedRange(
                'query exceeded max allowed range: query exceeds max results 20000, retry with the range 59066104-59066970',
            ),
        ).toEqual({ from: 59066104, to: 59066970 });
    });

    it('ignores messages without a range and nonsensical ranges', () => {
        expect(parseSuggestedRange('requested range too large')).toBeUndefined();
        expect(parseSuggestedRange('retry with the range 500-100')).toBeUndefined();
    });
});

describe(parseMaxRangeBlocks.name, () => {
    it('reads the cap a plan-limited provider names', () => {
        expect(parseMaxRangeBlocks('ranges over 10000 blocks are not supported on free plan')).toBe(
            10_000,
        );
    });

    it('reads the other shapes providers phrase it in', () => {
        expect(parseMaxRangeBlocks('Block range too large; currently limited to 100 blocks')).toBe(
            100,
        );
        expect(parseMaxRangeBlocks('exceeds maximum block range: 5000')).toBe(5_000);
    });

    it('returns nothing when no cap is named', () => {
        expect(parseMaxRangeBlocks('requested range too large')).toBeUndefined();
        expect(parseMaxRangeBlocks('rate limit exceeded')).toBeUndefined();
    });
});

describe(getRpcErrorInfo.name, () => {
    it('finds the code and message however deeply viem nested them', () => {
        const nested = Object.assign(new Error('outer'), {
            cause: Object.assign(new Error('inner'), { code: -32005 }),
        });

        const info = getRpcErrorInfo(nested);

        expect(info.code).toBe(-32005);
        expect(info.message).toContain('inner');
    });

    it('survives a non-error rejection', () => {
        expect(getRpcErrorInfo('nope')).toEqual({ code: undefined, message: '' });
    });
});

describe(scanTransferLogs.name, () => {
    it('splits the range into chunks and queries both topic positions', async () => {
        const request = jest.fn().mockResolvedValue([]);
        const { client, ranges } = createClient(request);

        await scanTransferLogs(client, ADDRESS, { from: 1, to: 40_000 }, 20_000);

        // 2 chunks x sent + received
        expect(request).toHaveBeenCalledTimes(4);
        expect(ranges().sort()).toEqual(
            [
                [1, 20_000],
                [20_001, 40_000],
                [1, 20_000],
                [20_001, 40_000],
            ].sort(),
        );
    });

    it('continues from the range a result-capped provider suggests', async () => {
        const request = jest
            .fn()
            .mockRejectedValueOnce(
                rpcError(-32602, 'query exceeds max results 20000, retry with the range 1-500'),
            )
            .mockResolvedValue([log(400)]);
        const { client, ranges } = createClient(request);

        const result = await scanTransferLogs(client, ADDRESS, { from: 1, to: 1_000 }, 20_000);

        expect(result.complete).toBe(true);
        expect(ranges()).toContainEqual([1, 500]);
        expect(ranges()).toContainEqual([501, 1_000]);
    });

    it('halves a range the provider calls too large', async () => {
        const request = jest.fn().mockImplementation(({ params }: { params: RequestParams }) => {
            const span = Number(params[0].toBlock) - Number(params[0].fromBlock) + 1;

            return span > 500
                ? Promise.reject(rpcError(-32012, 'requested range too large'))
                : Promise.resolve([]);
        });
        const { client, ranges } = createClient(request);

        const result = await scanTransferLogs(client, ADDRESS, { from: 0, to: 1_999 }, 2_000);

        expect(result.complete).toBe(true);

        // The halves that were actually accepted must tile the requested range without a gap,
        // which is the property halving exists to preserve.
        const accepted = [
            ...new Set(
                ranges()
                    .filter(([from, to]) => to - from + 1 <= 500)
                    .map(range => range.join(',')),
            ),
        ]
            .map(key => key.split(',').map(Number) as [number, number])
            .sort((a, b) => a[0] - b[0]);

        expect(accepted.length).toBeGreaterThan(1);
        expect(accepted[0]?.[0]).toBe(0);
        expect(accepted.at(-1)?.[1]).toBe(1_999);
        accepted.forEach(([from], index) => {
            if (index > 0) expect(from).toBe((accepted[index - 1]?.[1] ?? NaN) + 1);
        });
    });

    it('retries a rate-limited range after backing off', async () => {
        jest.useFakeTimers();
        const request = jest
            .fn()
            .mockRejectedValueOnce(rpcError(-32005, 'rate limit exceeded'))
            .mockResolvedValue([log(10)]);
        const { client } = createClient(request);

        const pending = scanTransferLogs(client, ADDRESS, { from: 1, to: 100 }, 20_000);
        await jest.advanceTimersByTimeAsync(5_000);
        const result = await pending;

        expect(result.complete).toBe(true);
        // one per topic position, the rate-limited one only after its retry
        expect(result.logs).toHaveLength(2);
        expect(request).toHaveBeenCalledTimes(3);
        jest.useRealTimers();
    });

    it('reports an incomplete scan instead of pretending the range was empty', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const request = jest.fn().mockRejectedValue(rpcError(-32000, 'server confused'));
        const { client } = createClient(request);

        const result = await scanTransferLogs(client, ADDRESS, { from: 1, to: 100 }, 20_000);

        expect(result.complete).toBe(false);
        expect(result.logs).toEqual([]);
        // the caller needs to know which part was missed, so it can still claim the rest
        expect(result.failed).not.toHaveLength(0);
        warn.mockRestore();
    });

    it('adopts the cap a plan-limited provider names, in one round of rejections', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const request = jest.fn().mockImplementation(({ params }: { params: RequestParams }) => {
            const span = Number(params[0].toBlock) - Number(params[0].fromBlock) + 1;

            return span > 10_000
                ? Promise.reject(
                      rpcError(-32602, 'ranges over 10000 blocks are not supported on free plan'),
                  )
                : Promise.resolve([]);
        });
        const { client, ranges } = createClient(request);

        // 200k blocks as 20k chunks is 10 oversized chunks per topic position, so 20 rejections
        // if nothing is learned.
        const result = await scanTransferLogs(client, ADDRESS, { from: 1, to: 200_000 }, 20_000);

        expect(result.complete).toBe(true);

        const rejected = ranges().filter(([from, to]) => to - from + 1 > 10_000);
        const accepted = ranges().filter(([from, to]) => to - from + 1 <= 10_000);

        // Only the batch already in flight when the cap is learned can still be rejected; the
        // rest of the queue is re-split before it is ever sent.
        expect(rejected.length).toBeLessThanOrEqual(2 * MAX_LOG_CONCURRENCY);
        expect(accepted.length).toBe(40);
        warn.mockRestore();
    });

    it('remembers the cap, so a later scan on the same connection never oversteps it', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const request = jest.fn().mockImplementation(({ params }: { params: RequestParams }) => {
            const span = Number(params[0].toBlock) - Number(params[0].fromBlock) + 1;

            return span > 10_000
                ? Promise.reject(rpcError(-32602, 'ranges over 10000 blocks are not supported'))
                : Promise.resolve([]);
        });
        const { client, ranges } = createClient(request);

        await scanTransferLogs(client, ADDRESS, { from: 1, to: 40_000 }, 20_000);
        const afterFirstScan = ranges().length;

        await scanTransferLogs(client, ADDRESS, { from: 100_001, to: 140_000 }, 20_000);

        const secondScan = ranges().slice(afterFirstScan);
        expect(secondScan.length).toBeGreaterThan(0);
        expect(secondScan.every(([from, to]) => to - from + 1 <= 10_000)).toBe(true);
        warn.mockRestore();
    });

    it('does nothing for an inverted range', async () => {
        const request = jest.fn();
        const { client } = createClient(request);

        expect(await scanTransferLogs(client, ADDRESS, { from: 100, to: 1 })).toEqual({
            logs: [],
            complete: true,
            failed: [],
        });
        expect(request).not.toHaveBeenCalled();
    });
});
