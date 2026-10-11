import { type PublicClient, createPublicClient } from 'viem';

import { HISTORY_STEP_BLOCKS, MAX_LOG_CONCURRENCY, TRANSFER_TOPIC } from './constants';
import {
    padAddressTopic,
    parseMaxRangeBlocks,
    parseSuggestedRange,
    scanTransferLogs,
} from './logScanner';
import { getRpcErrorInfo } from '../utils/errors';
import { wasRateLimitedSince } from '../utils/rateLimit';
import { getTransport } from '../utils/transportType';

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
        expect(parseMaxRangeBlocks('eth_getLogs is limited to a 10,000 range')).toBe(10_000);
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

    it('keeps the start of the chunk when the suggested range starts later', async () => {
        const request = jest
            .fn()
            .mockRejectedValueOnce(
                rpcError(-32602, 'query exceeds max results 20000, retry with the range 300-500'),
            )
            .mockResolvedValue([]);
        const { client, ranges } = createClient(request);

        const result = await scanTransferLogs(client, ADDRESS, { from: 1, to: 1_000 }, 20_000);

        expect(result.complete).toBe(true);
        expect(ranges()).toContainEqual([1, 500]);
        expect(ranges()).toContainEqual([501, 1_000]);
        expect(ranges()).not.toContainEqual([300, 500]);
    });

    it('ignores a suggested range outside the chunk', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const request = jest
            .fn()
            .mockRejectedValueOnce(
                rpcError(-32602, 'query exceeds max results 20000, retry with the range 1-50'),
            )
            .mockResolvedValue([]);
        const { client, ranges } = createClient(request);

        await scanTransferLogs(client, ADDRESS, { from: 101, to: 1_000 }, 20_000);

        expect(ranges().every(([from]) => from >= 101)).toBe(true);
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

    it('backs off from an HTTP 429, which fails a whole batch at once', async () => {
        jest.useFakeTimers();
        const request = jest
            .fn()
            .mockRejectedValueOnce(
                Object.assign(new Error('HTTP request failed.'), {
                    cause: Object.assign(new Error('Too Many Requests'), { status: 429 }),
                }),
            )
            .mockResolvedValue([]);
        const { client } = createClient(request);

        const pending = scanTransferLogs(client, ADDRESS, { from: 1, to: 100 }, 20_000);
        await jest.advanceTimersByTimeAsync(5_000);
        const result = await pending;

        expect(result.complete).toBe(true);
        expect(request).toHaveBeenCalledTimes(3);
        jest.useRealTimers();
    });

    it('remembers a rate limit that cost part of the scan', async () => {
        jest.useFakeTimers();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const request = jest.fn().mockRejectedValue(rpcError(-32005, 'rate limit exceeded'));
        const { client } = createClient(request);

        const pending = scanTransferLogs(client, ADDRESS, { from: 1, to: 100 }, 20_000);
        await jest.advanceTimersByTimeAsync(60_000);
        const result = await pending;

        expect(result.complete).toBe(false);
        expect(wasRateLimitedSince(client, 0)).toBe(true);
        warn.mockRestore();
        jest.useRealTimers();
    });

    it('does not count a rate limit its retry got past as a loss', async () => {
        jest.useFakeTimers();
        const request = jest
            .fn()
            .mockRejectedValueOnce(rpcError(-32005, 'rate limit exceeded'))
            .mockResolvedValue([]);
        const { client } = createClient(request);

        const pending = scanTransferLogs(client, ADDRESS, { from: 1, to: 100 }, 20_000);
        await jest.advanceTimersByTimeAsync(5_000);
        await pending;

        expect(wasRateLimitedSince(client, 0)).toBe(false);
        jest.useRealTimers();
    });

    it('sends fewer queries at once after a rate limit, instead of retrying them all together', async () => {
        jest.useFakeTimers();
        let inFlight = 0;
        let mostInFlightAfterLimit = 0;
        let isLimited = false;
        const request = jest.fn(async () => {
            inFlight++;
            if (isLimited) mostInFlightAfterLimit = Math.max(mostInFlightAfterLimit, inFlight);
            await new Promise(resolve => setTimeout(resolve, 100));
            inFlight--;
            if (request.mock.calls.length <= 40) {
                isLimited = true;
                throw rpcError(-32005, 'rate limit exceeded');
            }

            return [];
        });
        const { client } = createClient(request);

        // 20 chunks per topic position, so all 40 first queries go out together.
        const pending = scanTransferLogs(client, ADDRESS, { from: 0, to: 199 }, 10);
        await jest.advanceTimersByTimeAsync(60_000);
        const result = await pending;

        expect(result.complete).toBe(true);
        expect(mostInFlightAfterLimit).toBeLessThanOrEqual(20);
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

    it('converges quickly when the provider refuses less than the cap it names', async () => {
        // Observed on Arc: it rejects ~9950 blocks while the message names 10000 as the limit.
        // Deriving a cap from that name shaves one block off per round trip, so the scan has to
        // fall back to halving instead of trusting the number.
        const request = jest.fn(({ params }: { params: RequestParams }) => {
            const from = Number(params[0].fromBlock);
            const to = Number(params[0].toBlock);

            return to - from + 1 > 9_000
                ? Promise.reject(
                      rpcError(-32012, 'ranges over 10000 blocks are not supported on free plan'),
                  )
                : Promise.resolve([]);
        });
        const { client, ranges } = createClient(request);

        const result = await scanTransferLogs(client, ADDRESS, { from: 1, to: 10_000 }, 10_000);

        expect(result.complete).toBe(true);
        // a handful of halvings, not one request per block shaved off
        expect(ranges().length).toBeLessThan(20);
        // and it must not collapse to single-block requests
        expect(ranges().filter(([from, to]) => to - from + 1 === 1).length).toBe(0);
    });

    it('still adopts a named cap that genuinely shortens the range', async () => {
        const request = jest.fn(({ params }: { params: RequestParams }) => {
            const from = Number(params[0].fromBlock);
            const to = Number(params[0].toBlock);

            return to - from + 1 > 2_000
                ? Promise.reject(rpcError(-32012, 'currently limited to 2000 blocks'))
                : Promise.resolve([]);
        });
        const { client, ranges } = createClient(request);

        await scanTransferLogs(client, ADDRESS, { from: 1, to: 10_000 }, 10_000);

        const served = ranges().filter(([from, to]) => to - from + 1 <= 2_000);
        expect(Math.max(...served.map(([from, to]) => to - from + 1))).toBe(2_000);
    });

    describe('over the batched HTTP transport', () => {
        type JsonRpcCall = { id: number; params: RequestParams };

        // arc.trezor.io (QuickNode) rejects anything wider than 10k blocks this way.
        const respond = ({ id, params }: JsonRpcCall) =>
            Number(params[0].toBlock) - Number(params[0].fromBlock) + 1 > 10_000
                ? {
                      jsonrpc: '2.0',
                      id,
                      error: { code: -32614, message: 'eth_getLogs is limited to a 10,000 range' },
                  }
                : { jsonrpc: '2.0', id, result: [] };

        const stubFetch = () => {
            const inFlight = { now: 0, max: 0 };
            const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
                const calls: JsonRpcCall[] = JSON.parse(String(init?.body));
                inFlight.now++;
                inFlight.max = Math.max(inFlight.max, inFlight.now);
                await new Promise(resolve => setTimeout(resolve, 10));
                inFlight.now--;

                return new Response(JSON.stringify(calls.map(respond)), {
                    headers: { 'content-type': 'application/json' },
                });
            });

            return { fetch, inFlight };
        };

        const createBatchedClient = () => {
            const transport = getTransport('https://rpc.test');
            if (!transport) throw new Error('No transport for an https URL');

            return createPublicClient({ transport }) as PublicClient;
        };

        // viem's batch scheduler flushes on a timer, which fake timers left by a failed test would hold.
        beforeEach(() => jest.useRealTimers());
        afterEach(() => jest.restoreAllMocks());

        it('sends a whole history step as two HTTP requests at once', async () => {
            const { fetch, inFlight } = stubFetch();

            const result = await scanTransferLogs(createBatchedClient(), ADDRESS, {
                from: 1,
                to: HISTORY_STEP_BLOCKS,
            });

            expect(result.complete).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(inFlight.max).toBe(2);
        });

        it('learns the cap from the errors inside a batch response', async () => {
            const { fetch } = stubFetch();

            const result = await scanTransferLogs(
                createBatchedClient(),
                ADDRESS,
                { from: 1, to: 1_000_000 },
                20_000,
            );

            expect(result.complete).toBe(true);
            // 100 oversized queries rejected in one request, then all 200 halves in one more
            expect(fetch).toHaveBeenCalledTimes(2);
        });
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
