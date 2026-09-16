import { type PublicClient, encodeAbiParameters, parseAbiParameters } from 'viem';

import type { MessageTypes, Response } from '@trezor/blockchain-link-types';

import { getAccountInfo } from './getAccountInfo';
import { WorkerState } from '../../state';
import { TRANSFER_TOPIC } from '../history/constants';
import type { Request } from '../types';

const ME = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const OTHER = '0x1111111111111111111111111111111111111111';
const SENTINEL = '0xfffffffffffffffffffffffffffffffffffffffe';
const ARC_TESTNET_CHAIN_ID = 5042002;
const LATEST = 1_000_000;

// What the Arc testnet known-token list holds.
const EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;
const CWBTC = '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF' as const;
const HAND_ADDED_TOKEN = '0x2222222222222222222222222222222222222222' as const;

const mockGetKnownTokens = jest.fn<Promise<readonly `0x${string}`[]>, [PublicClient]>();

jest.mock('../tokens/knownTokens', () => ({
    getKnownTokens: (client: PublicClient) => mockGetKnownTokens(client),
}));

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

const nativeLog = (blockNumber: number, txid: string) => ({
    address: SENTINEL,
    topics: [TRANSFER_TOPIC, topic(OTHER), topic(ME)],
    data: `0x${'0'.repeat(63)}5`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: txid,
    transactionIndex: '0x0',
});

const tokenLog = (contract: string, blockNumber: number, txid: string) => ({
    address: contract.toLowerCase(),
    topics: [TRANSFER_TOPIC, topic(OTHER), topic(ME)],
    data: `0x${'0'.repeat(63)}5`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: txid,
    transactionIndex: '0x0',
});

const encodeUint = (value: bigint) => encodeAbiParameters(parseAbiParameters('uint256'), [value]);
const encodeString = (value: string) => encodeAbiParameters(parseAbiParameters('string'), [value]);
const encodeUint8 = (value: number) => encodeAbiParameters(parseAbiParameters('uint8'), [value]);
const encodeBool = (value: boolean) => encodeAbiParameters(parseAbiParameters('bool'), [value]);

type Entry = { success: boolean; returnData: `0x${string}` };

const ok = (returnData: `0x${string}`): Entry => ({ success: true, returnData });

const encodeAggregate3 = (entries: Entry[]) =>
    encodeAbiParameters(parseAbiParameters('(bool success, bytes returnData)[]'), [entries]);

// balanceOf, name, symbol, decimals, supportsInterface(ERC721), supportsInterface(ERC1155)
const tokenEntries = (symbol: string, balance: bigint): Entry[] => [
    ok(encodeUint(balance)),
    ok(encodeString(`${symbol} token`)),
    ok(encodeString(symbol)),
    ok(encodeUint8(6)),
    ok(encodeBool(false)),
    ok(encodeBool(false)),
];

type Harness = {
    client: PublicClient;
    rpcRequest: jest.Mock;
    contractCall: jest.Mock;
    txReads: () => number;
};

const createRequest = ({
    details,
    page,
    pageSize,
    contractFilter,
    logs = () => [],
    state = new WorkerState(),
    latest = LATEST,
    reuse,
    tokenBalance,
    multicallReads,
    watched = true,
}: {
    details?: MessageTypes.GetAccountInfo['payload']['details'];
    page?: number;
    pageSize?: number;
    contractFilter?: string;
    logs?: () => unknown[];
    state?: WorkerState;
    latest?: number;
    reuse?: Harness;
    /** Answers every contract read individually, for the no-Multicall3 path. */
    tokenBalance?: bigint;
    /** Answers the whole batch in one Multicall3 `aggregate3` response. */
    multicallReads?: Entry[];
    /** Suite subscribes an account once it takes it on; discovery candidates are not subscribed. */
    watched?: boolean;
}) => {
    if (watched) {
        state.addAccounts([{ descriptor: ME }]);
    }

    const request = jest.fn(() => Promise.resolve(logs()));
    const contractCall = jest.fn(() => {
        if (multicallReads) {
            return Promise.resolve({ data: encodeAggregate3(multicallReads) });
        }

        return tokenBalance === undefined
            ? Promise.reject(new Error('no token reads in this test'))
            : Promise.resolve({ data: encodeUint(tokenBalance) });
    });
    const getTransaction = jest.fn(({ hash }: { hash: string }) =>
        Promise.resolve({
            hash,
            from: OTHER,
            to: ME,
            value: 5n,
            nonce: 1,
            gas: 21000n,
            gasPrice: 1n,
            input: '0x',
            blockHash: '0xb',
            blockNumber: BigInt(LATEST),
        }),
    );
    const getTransactionReceipt = jest.fn(() =>
        Promise.resolve({
            status: 'success',
            gasUsed: 21000n,
            effectiveGasPrice: 1n,
            contractAddress: null,
            logs: [],
        }),
    );
    const client =
        reuse?.client ??
        ({
            request,
            getTransaction,
            getTransactionReceipt,
            // Multicall3 is only reachable where the batch can actually be answered.
            getCode: () => Promise.resolve(multicallReads ? '0x6080604052' : '0x'),
            call: contractCall,
            getBlock: () => Promise.resolve({ timestamp: 1n }),
            getBalance: () => Promise.resolve(0n),
            getTransactionCount: () => Promise.resolve(0),
            getBlockNumber: () => Promise.resolve(BigInt(latest)),
            getChainId: () => Promise.resolve(ARC_TESTNET_CHAIN_ID),
        } as unknown as PublicClient);

    return {
        client,
        rpcRequest: reuse?.rpcRequest ?? request,
        contractCall: reuse?.contractCall ?? contractCall,
        txReads: () => (reuse ? reuse.txReads() : getTransaction.mock.calls.length),
        state,
        payload: {
            type: 'm_get_account_info',
            id: 1,
            payload: { descriptor: ME, details, page, pageSize, contractFilter },
            connect: () => Promise.resolve(client),
            post: (_data: Response) => {},
            state,
            coinName: 'tARC',
        } as unknown as Request<MessageTypes.GetAccountInfo>,
    };
};

beforeEach(() => {
    mockGetKnownTokens.mockReset();
    mockGetKnownTokens.mockResolvedValue([EURC, CWBTC]);
});

describe(getAccountInfo.name, () => {
    it('keeps a cheap probe cheap and reports the transaction count as unknown', async () => {
        const { payload, rpcRequest, contractCall } = createRequest({ details: 'basic' });

        const { payload: info } = await getAccountInfo(payload);

        expect(rpcRequest).not.toHaveBeenCalled();
        expect(contractCall).not.toHaveBeenCalled();
        expect(mockGetKnownTokens).not.toHaveBeenCalled();
        expect(info.history.total).toBe(-1);
        expect(info.empty).toBe(true);
    });

    it('scans and reports a real count once transactions are asked for', async () => {
        const { payload, rpcRequest } = createRequest({
            details: 'txids',
            logs: () => [nativeLog(LATEST, '0xaaa'), nativeLog(LATEST - 1, '0xbbb')],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(rpcRequest).toHaveBeenCalled();
        expect(info.history.total).toBe(2);
        expect(info.history.txids).toEqual(['0xaaa', '0xbbb']);
        expect(info.empty).toBe(false);
    });

    it('reports the same count on a later cheap probe, so nothing refetches in a loop', async () => {
        const state = new WorkerState();
        const first = createRequest({
            details: 'txids',
            state,
            logs: () => [nativeLog(LATEST, '0xaaa')],
        });
        await getAccountInfo(first.payload);

        const second = createRequest({ details: 'basic', state, logs: () => [] });
        const { payload: info } = await getAccountInfo(second.payload);

        expect(info.history.total).toBe(1);
    });

    it('serves newest first and slices the requested page', async () => {
        const logs = Array.from({ length: 30 }, (_, index) =>
            nativeLog(LATEST - index, `0x${index.toString(16).padStart(4, '0')}`),
        );
        const { payload } = createRequest({ details: 'txids', page: 2, logs: () => logs });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.history.total).toBe(30);
        expect(info.page).toEqual({ index: 2, size: 25, total: 2 });
        expect(info.history.txids).toHaveLength(5);
        expect(info.history.txids?.[0]).toBe('0x0019');
    });

    it('never lists the contract mirroring the native asset as a token', async () => {
        const { payload } = createRequest({
            details: 'txids',
            logs: () => [nativeLog(LATEST, '0xaaa')],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.tokens).toBeUndefined();
    });
});

describe(`${getAccountInfo.name} token discovery`, () => {
    it('never scans logs for a request that only wants balances', async () => {
        const state = new WorkerState();

        // this is what account discovery asks for, once per candidate account
        const probe = createRequest({ details: 'basic', state, logs: () => [] });
        await getAccountInfo(probe.payload);

        expect(probe.rpcRequest).not.toHaveBeenCalled();
    });

    it('leaves tokens to the follow-up request that asks for them', async () => {
        const held = createRequest({ details: 'basic', tokenBalance: 5n });

        const { payload: info } = await getAccountInfo(held.payload);

        expect(held.contractCall).not.toHaveBeenCalled();
        expect(info.tokens).toBeUndefined();
    });

    it('picks a token up from its balance, with no log scan', async () => {
        const held = createRequest({ details: 'tokens', tokenBalance: 5n });

        const { payload: info } = await getAccountInfo(held.payload);

        expect(held.rpcRequest).not.toHaveBeenCalled();
        expect(info.tokens?.map(token => token.balance)).toContain('5');
        expect(info.empty).toBe(false);
    });

    it('lists the known tokens the account holds in a single batched read', async () => {
        const held = createRequest({
            details: 'tokens',
            multicallReads: [...tokenEntries('EURC', 500n), ...tokenEntries('CWBTC', 0n)],
        });

        const { payload: info } = await getAccountInfo(held.payload);

        expect(held.contractCall).toHaveBeenCalledTimes(1);
        expect(info.tokens).toEqual([
            expect.objectContaining({
                contract: EURC.toLowerCase(),
                balance: '500',
                symbol: 'EURC',
            }),
            expect.objectContaining({ contract: CWBTC.toLowerCase(), balance: '0' }),
        ]);
        // Holding a token is enough to count as used.
        expect(info.empty).toBe(false);
    });

    it('lists the known tokens at zero without counting the account as used', async () => {
        const { payload } = createRequest({
            details: 'tokens',
            multicallReads: [...tokenEntries('EURC', 0n), ...tokenEntries('CWBTC', 0n)],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.tokens).toEqual([
            expect.objectContaining({ contract: EURC.toLowerCase(), balance: '0' }),
            expect.objectContaining({ contract: CWBTC.toLowerCase(), balance: '0' }),
        ]);
        expect(info.empty).toBe(true);
    });

    it('leaves tokens out when nothing is worth checking', async () => {
        mockGetKnownTokens.mockResolvedValue([]);
        const { payload, contractCall } = createRequest({ details: 'txids', logs: () => [] });

        const { payload: info } = await getAccountInfo(payload);

        expect(contractCall).not.toHaveBeenCalled();
        expect(info.tokens).toBeUndefined();
    });

    it('keeps a token the log scan turned up listed once its balance is gone', async () => {
        mockGetKnownTokens.mockResolvedValue([CWBTC]);
        const { payload } = createRequest({
            details: 'txids',
            logs: () => [tokenLog(EURC, LATEST, '0xaaa')],
            multicallReads: [...tokenEntries('EURC', 0n), ...tokenEntries('CWBTC', 0n)],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.tokens).toEqual([
            expect.objectContaining({ contract: EURC.toLowerCase(), balance: '0' }),
            expect.objectContaining({ contract: CWBTC.toLowerCase(), balance: '0' }),
        ]);
    });

    it('reads a single contract on request and keeps reporting it afterwards, even at zero', async () => {
        const state = new WorkerState();
        const first = createRequest({
            state,
            details: 'tokenBalances',
            contractFilter: HAND_ADDED_TOKEN,
            multicallReads: tokenEntries('HAND', 3n),
        });

        const { payload: filtered } = await getAccountInfo(first.payload);

        expect(filtered.tokens).toEqual([
            expect.objectContaining({ contract: HAND_ADDED_TOKEN, balance: '3', symbol: 'HAND' }),
        ]);

        const second = createRequest({
            state,
            details: 'tokens',
            multicallReads: [
                ...tokenEntries('HAND', 0n),
                ...tokenEntries('EURC', 0n),
                ...tokenEntries('CWBTC', 0n),
            ],
        });

        const { payload: listed } = await getAccountInfo(second.payload);

        expect(listed.tokens).toEqual([
            expect.objectContaining({ contract: HAND_ADDED_TOKEN, balance: '0' }),
            expect.objectContaining({ contract: EURC.toLowerCase(), balance: '0' }),
            expect.objectContaining({ contract: CWBTC.toLowerCase(), balance: '0' }),
        ]);
    });

    it('re-scans the blocks at the tip, whose logs may not have been queryable yet', async () => {
        const state = new WorkerState();

        // first sync sees the tip block but the provider has no logs for it yet
        const primed = createRequest({ details: 'txs', state, logs: () => [] });
        await getAccountInfo(primed.payload);

        // the tip has not moved, and now the log for that same block is served
        const retry = createRequest({
            details: 'txs',
            state,
            logs: () => [tokenLog(EURC, LATEST, `0x${'cd'.repeat(32)}`)],
        });
        const { payload: info } = await getAccountInfo(retry.payload);

        expect(info.history.total).toBe(1);
    });
});

describe(`${getAccountInfo.name} request cost`, () => {
    it('does not re-read transactions it has already mapped', async () => {
        const state = new WorkerState();
        const logs = [nativeLog(LATEST, `0x${'ab'.repeat(32)}`)];
        const first = createRequest({ details: 'txs', state, logs: () => logs });

        await getAccountInfo(first.payload);
        const readsAfterFirst = first.txReads();

        expect(readsAfterFirst).toBeGreaterThan(0);

        const second = createRequest({ details: 'txs', state, logs: () => logs, reuse: first });
        await getAccountInfo(second.payload);

        // the same transaction, still mapped only once across both calls
        expect(second.txReads()).toBe(readsAfterFirst);
    });
});

describe(`${getAccountInfo.name} discovery cost`, () => {
    it('costs no log scan for the balance probe discovery sends', async () => {
        const candidate = createRequest({
            details: 'basic',
            watched: false,
            logs: () => [nativeLog(LATEST, `0x${'ef'.repeat(32)}`)],
        });

        const { payload: info } = await getAccountInfo(candidate.payload);

        expect(candidate.rpcRequest).not.toHaveBeenCalled();
        expect(candidate.txReads()).toBe(0);
        expect(info.empty).toBe(true);
    });

    it('reads history whenever transactions are asked for, subscribed or not', async () => {
        const candidate = createRequest({
            details: 'txs',
            watched: false,
            logs: () => [nativeLog(LATEST, `0x${'ef'.repeat(32)}`)],
        });

        const { payload: info } = await getAccountInfo(candidate.payload);

        expect(candidate.rpcRequest).toHaveBeenCalled();
        expect(info.history.total).toBe(1);
    });
});
