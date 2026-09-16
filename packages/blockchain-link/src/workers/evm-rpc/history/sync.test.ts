import type { PublicClient } from 'viem';

import { INITIAL_HISTORY_BLOCKS, TIP_LAG_BLOCKS, TRANSFER_TOPIC } from './constants';
import { getDescriptorHistory, isCold, recordOwnTxid } from './state';
import { syncHistory } from './sync';
import { WorkerState } from '../../state';

const ME = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const OTHER = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const SENTINEL = '0xfffffffffffffffffffffffffffffffffffffffe';
const ARC_TESTNET_CHAIN_ID = 5042002;
const LATEST = 1_000_000;

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

const rawLog = ({
    address,
    blockNumber,
    txid,
    index = 0,
    timestamp,
}: {
    address: string;
    blockNumber: number;
    txid: string;
    index?: number;
    timestamp?: number;
}) => ({
    address: address.toLowerCase(),
    topics: [TRANSFER_TOPIC, topic(OTHER), topic(ME)],
    data: `0x${'0'.repeat(63)}5`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: txid,
    transactionIndex: `0x${index.toString(16)}`,
    ...(timestamp !== undefined && { blockTimestamp: `0x${timestamp.toString(16)}` }),
});

const createClient = ({
    logs = () => [],
    getTransactionReceipt = jest.fn(),
}: {
    logs?: (from: number, to: number) => unknown[];
    getTransactionReceipt?: jest.Mock;
} = {}) => {
    const request = jest.fn(({ params }: { params: [{ fromBlock: string; toBlock: string }] }) =>
        Promise.resolve(logs(Number(params[0].fromBlock), Number(params[0].toBlock))),
    );

    return {
        request,
        getTransactionReceipt,
        client: {
            request,
            getBlockNumber: () => Promise.resolve(BigInt(LATEST)),
            getChainId: () => Promise.resolve(ARC_TESTNET_CHAIN_ID),
            getTransactionReceipt,
        } as unknown as PublicClient,
        scannedRanges: (): [number, number][] =>
            request.mock.calls.map(
                ([{ params }]: [{ params: [{ fromBlock: string; toBlock: string }] }]) => [
                    Number(params[0].fromBlock),
                    Number(params[0].toBlock),
                ],
            ),
    };
};

describe(syncHistory.name, () => {
    it('looks back one chunk from the chain tip the first time, not a whole window', async () => {
        const state = new WorkerState();
        const { client, scannedRanges } = createClient();

        const history = await syncHistory({ client, state, descriptor: ME });

        const expectedFrom = LATEST - INITIAL_HISTORY_BLOCKS + 1;
        expect(Math.min(...scannedRanges().map(([from]) => from))).toBe(expectedFrom);
        expect(Math.max(...scannedRanges().map(([, to]) => to))).toBe(LATEST);
        expect(history.syncedFrom).toBe(expectedFrom);
        // the tip itself is scanned but deliberately not claimed, so it gets scanned again
        expect(history.syncedTo).toBe(LATEST - TIP_LAG_BLOCKS);
    });

    it('only catches up on new blocks once warm', async () => {
        const state = new WorkerState();
        const history = getDescriptorHistory(state, ME);
        history.syncedFrom = LATEST - 100;
        history.syncedTo = LATEST - 10;
        const { client, scannedRanges } = createClient();

        await syncHistory({ client, state, descriptor: ME });

        expect(scannedRanges().every(([from, to]) => from === LATEST - 9 && to === LATEST)).toBe(
            true,
        );
        expect(history.syncedFrom).toBe(LATEST - 100);
        expect(history.syncedTo).toBe(LATEST - TIP_LAG_BLOCKS);
    });

    it('extends backwards when asked for older history', async () => {
        const state = new WorkerState();
        const history = getDescriptorHistory(state, ME);
        history.syncedFrom = LATEST - 100;
        history.syncedTo = LATEST;
        const { client, scannedRanges } = createClient();

        await syncHistory({
            client,
            state,
            descriptor: ME,
            fromBlock: LATEST - 300,
        });

        expect(scannedRanges()).toContainEqual([LATEST - 300, LATEST - 101]);
        expect(history.syncedFrom).toBe(LATEST - 300);
    });

    it('keeps what it found but does not claim the range when a scan fails', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const state = new WorkerState();
        let call = 0;
        const { client } = createClient({
            logs: (_from, to) => {
                call += 1;
                if (call === 1) {
                    return [rawLog({ address: TOKEN, blockNumber: to, txid: '0xaaa' })];
                }
                throw Object.assign(new Error('server confused'), { code: -32000 });
            },
        });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect(history.entries.has('0xaaa')).toBe(true);
        expect(isCold(history)).toBe(true);
        warn.mockRestore();
    });

    it('discovers token contracts but never the ones mirroring the native asset', async () => {
        const state = new WorkerState();
        const { client } = createClient({
            logs: (_from, to) => [
                rawLog({ address: TOKEN, blockNumber: to, txid: '0xtoken' }),
                rawLog({ address: SENTINEL, blockNumber: to, txid: '0xnative' }),
            ],
        });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect([...history.tokenContracts]).toEqual([TOKEN.toLowerCase()]);
        expect(history.entries.size).toBe(2);
    });

    it('keeps the block timestamp a log carried', async () => {
        const state = new WorkerState();
        const { client } = createClient({
            logs: (_from, to) => [
                rawLog({
                    address: TOKEN,
                    blockNumber: to,
                    txid: '0xaaa',
                    timestamp: 1_788_000_000,
                }),
            ],
        });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect(history.entries.get('0xaaa')?.blockTimestamp).toBe(1_788_000_000);
    });

    it('resolves a broadcast transaction that moved nothing a log scan could see', async () => {
        const state = new WorkerState();
        recordOwnTxid(state, '0xapproval');
        const getTransactionReceipt = jest.fn().mockResolvedValue({
            blockNumber: 999_999n,
            transactionIndex: 3,
            from: ME.toLowerCase(),
            to: TOKEN.toLowerCase(),
        });
        const { client } = createClient({ getTransactionReceipt });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect(history.entries.get('0xapproval')).toMatchObject({
            blockNumber: 999_999,
            transactionIndex: 3,
        });
    });

    it('leaves a broadcast transaction belonging to another account alone', async () => {
        const state = new WorkerState();
        recordOwnTxid(state, '0xsomeoneelse');
        const getTransactionReceipt = jest.fn().mockResolvedValue({
            blockNumber: 999_999n,
            transactionIndex: 3,
            from: OTHER,
            to: TOKEN.toLowerCase(),
        });
        const { client } = createClient({ getTransactionReceipt });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect(history.entries.has('0xsomeoneelse')).toBe(false);
    });
});

describe(`${syncHistory.name} partial progress`, () => {
    /**
     * A rate-limited chunk used to discard the whole scan, leaving the account cold and rescanning
     * its entire window on every later call - which provoked more rate limiting.
     */
    it('claims the part of a window it did scan, so a failed chunk is not rescanned forever', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const state = new WorkerState();
        const failBelow = LATEST - 40_000;
        const { client } = createClient({
            logs: (from: number) => {
                if (from < failBelow) {
                    throw Object.assign(new Error('server confused'), { code: -32000 });
                }

                return [];
            },
        });

        const history = await syncHistory({ client, state, descriptor: ME });

        expect(isCold(history)).toBe(false);
        // everything above the highest gap is contiguous and therefore claimable
        expect(history.syncedFrom).toBeGreaterThanOrEqual(failBelow);
        expect(history.syncedTo).toBe(LATEST - TIP_LAG_BLOCKS);
        warn.mockRestore();
    });

    it('only advances up to the first gap when catching up', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const state = new WorkerState();
        const history = getDescriptorHistory(state, ME);
        history.syncedFrom = LATEST - 50_000;
        history.syncedTo = LATEST - 25_000;

        const { client } = createClient({
            logs: (from: number) => {
                if (from > LATEST - 12_000) {
                    throw Object.assign(new Error('server confused'), { code: -32000 });
                }

                return [];
            },
        });

        await syncHistory({ client, state, descriptor: ME });

        // advanced as far as the chunk before the gap, and stopped short of the tip
        expect(history.syncedTo).toBeGreaterThan(LATEST - 25_000);
        expect(history.syncedTo).toBeLessThan(LATEST - TIP_LAG_BLOCKS);
        warn.mockRestore();
    });
});
