import { type PublicClient, decodeFunctionData, encodeFunctionResult, erc20Abi } from 'viem';

import { TRANSFER_TOPIC } from './constants';
import { mapEntries } from './getHistory';
import { padAddressTopic } from './logScanner';
import type { HistoryEntry } from './state';
import { ERC165_ABI } from '../tokens/constants';

const ME = '0xcae32cd53a96209fa02c0c0cfe165a5c97d456df';
const OTHER = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x89b50855aa3be2f677cd6303cec089b5f319d72a';
const TXID = `0x${'abc1'.padStart(64, '0')}`;
const METADATA_ABI = [...erc20Abi, ...ERC165_ABI];

type TokenAnswers = Partial<Record<string, string | number>>;

const createClient = ({
    token = { name: 'Euro Coin', symbol: 'EURC', decimals: 6 },
    isBlockReadable = () => true,
}: {
    token?: TokenAnswers;
    isBlockReadable?: () => boolean;
} = {}) => {
    const getTransaction = jest.fn(() =>
        Promise.resolve({
            hash: TXID,
            from: OTHER,
            to: TOKEN,
            value: 0n,
            nonce: 1,
            gas: 60_000n,
            gasPrice: 1n,
            input: '0x',
            blockHash: '0xb',
            blockNumber: 500n,
        }),
    );

    // Multicall3 is absent, so every metadata read is a call of its own that either answers or
    // reverts. ERC-165 is left unimplemented, like on most ERC-20 tokens.
    const call = jest.fn(({ data }: { data: `0x${string}` }) => {
        const { functionName } = decodeFunctionData({ abi: METADATA_ABI, data });
        const answer = functionName === 'supportsInterface' ? undefined : token[functionName];
        if (answer === undefined) return Promise.reject(new Error('execution reverted'));

        return Promise.resolve({
            data: encodeFunctionResult({
                abi: METADATA_ABI,
                functionName,
                result: answer,
            } as Parameters<typeof encodeFunctionResult>[0]),
        });
    });

    const client = {
        getChainId: () => Promise.resolve(5042002),
        getCode: () => Promise.resolve('0x'),
        call,
        getTransaction,
        getTransactionReceipt: () =>
            Promise.resolve({
                status: 'success',
                gasUsed: 60_000n,
                effectiveGasPrice: 1n,
                contractAddress: null,
                logs: [
                    {
                        address: TOKEN,
                        topics: [TRANSFER_TOPIC, padAddressTopic(OTHER), padAddressTopic(ME)],
                        data: `0x${(1_500_000).toString(16).padStart(64, '0')}`,
                    },
                ],
            }),
        getBlock: () =>
            isBlockReadable()
                ? Promise.resolve({ timestamp: 1_700_000_000n })
                : Promise.reject(new Error('rate limited')),
    } as unknown as PublicClient;

    return { client, getTransaction };
};

const entry = (blockTimestamp?: number): HistoryEntry => ({
    txid: TXID,
    blockNumber: 500,
    transactionIndex: 0,
    blockTimestamp,
});

const load = (client: PublicClient, { isDated = true } = {}) =>
    mapEntries({ client, descriptor: ME, entries: [entry(isDated ? 1_700_000_000 : undefined)] });

describe(mapEntries.name, () => {
    it('maps a transaction once and serves it from the cache afterwards', async () => {
        const { client, getTransaction } = createClient();

        const [first] = await load(client);
        await load(client);

        expect(first?.tokens[0]?.decimals).toBe(6);
        expect(getTransaction).toHaveBeenCalledTimes(1);
    });

    it('reads the transaction again while its block date could not be read', async () => {
        let isBlockReadable = false;
        const { client, getTransaction } = createClient({ isBlockReadable: () => isBlockReadable });

        const [undated] = await load(client, { isDated: false });
        await load(client, { isDated: false });
        isBlockReadable = true;
        const [dated] = await load(client, { isDated: false });
        await load(client, { isDated: false });

        expect(undated?.blockTime).toBe(0);
        expect(dated?.blockTime).toBe(1_700_000_000);
        expect(getTransaction).toHaveBeenCalledTimes(3);
    });

    it('retries a token that answered no metadata, then gives up on it', async () => {
        const { client, getTransaction } = createClient({ token: {} });

        await load(client);
        await load(client);
        await load(client);
        await load(client);

        expect(getTransaction).toHaveBeenCalledTimes(3);
    });

    it('caches a token that answers but has no decimals, as that will not change', async () => {
        const { client, getTransaction } = createClient({
            token: { name: 'No Decimals', symbol: 'ND' },
        });

        await load(client);
        await load(client);

        expect(getTransaction).toHaveBeenCalledTimes(1);
    });
});
