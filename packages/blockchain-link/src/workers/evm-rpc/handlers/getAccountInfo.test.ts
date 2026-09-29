import { type PublicClient, encodeAbiParameters, parseAbiParameters } from 'viem';

import { MESSAGES } from '@trezor/blockchain-link-types';
import type { MessageTypes } from '@trezor/blockchain-link-types';

import { getAccountInfo } from './getAccountInfo';
import { WorkerState } from '../../state';
import type { Request } from '../types';

const ME = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const KNOWN_TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const OTHER_KNOWN_TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const;
const HAND_ADDED_TOKEN = '0x1111111111111111111111111111111111111111' as const;
// No staking pool is configured for this chain, so account info needs no accounting reads.
const CHAIN_ID = 999;

const mockGetKnownTokens = jest.fn<Promise<readonly `0x${string}`[]>, [PublicClient]>();

jest.mock('../tokens/knownTokens', () => ({
    getKnownTokens: (client: PublicClient) => mockGetKnownTokens(client),
}));

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

type ClientOptions = {
    balance?: bigint;
    nonce?: number;
    contractReads?: Entry[];
};

const createClient = ({ balance = 0n, nonce = 0, contractReads = [] }: ClientOptions = {}) => {
    const client = {
        getBalance: jest.fn().mockResolvedValue(balance),
        getTransactionCount: jest.fn(({ blockTag }: { blockTag?: string }) =>
            Promise.resolve(blockTag === 'pending' ? nonce + 1 : nonce),
        ),
        getChainId: jest.fn().mockResolvedValue(CHAIN_ID),
        getCode: jest.fn().mockResolvedValue('0x6080604052'),
        call: jest.fn().mockResolvedValue({ data: encodeAggregate3(contractReads) }),
    };

    return { client, asPublicClient: client as unknown as PublicClient };
};

type RequestOptions = {
    client: PublicClient;
    state?: WorkerState;
    details?: MessageTypes.GetAccountInfo['payload']['details'];
    contractFilter?: string;
};

const createRequest = ({
    client,
    state = new WorkerState(),
    details,
    contractFilter,
}: RequestOptions): Request<MessageTypes.GetAccountInfo> => ({
    type: MESSAGES.GET_ACCOUNT_INFO,
    payload: { descriptor: ME, details, contractFilter },
    connect: () => Promise.resolve(client),
    post: jest.fn(),
    state,
    coinName: 'ETH',
});

describe(getAccountInfo.name, () => {
    beforeEach(() => {
        mockGetKnownTokens.mockResolvedValue([KNOWN_TOKEN, OTHER_KNOWN_TOKEN]);
    });

    it('answers basic with balance and nonce and never touches a contract', async () => {
        const { client, asPublicClient } = createClient({ balance: 5n, nonce: 2 });

        const response = await getAccountInfo(
            createRequest({ client: asPublicClient, details: 'basic' }),
        );

        expect(client.call).not.toHaveBeenCalled();
        expect(mockGetKnownTokens).not.toHaveBeenCalled();
        expect(response.payload).toMatchObject({
            descriptor: ME,
            balance: '5',
            empty: false,
            tokens: undefined,
            history: { total: -1, unconfirmed: 1 },
            misc: { nonce: '2' },
        });
    });

    it('reports an unused address as empty', async () => {
        const { asPublicClient } = createClient();

        const response = await getAccountInfo(createRequest({ client: asPublicClient }));

        expect(response.payload.empty).toBe(true);
    });

    it('lists the known tokens the account holds when asked for tokens', async () => {
        const { client, asPublicClient } = createClient({
            contractReads: [...tokenEntries('USDC', 500n), ...tokenEntries('USDT', 0n)],
        });

        const response = await getAccountInfo(
            createRequest({ client: asPublicClient, details: 'tokens' }),
        );

        expect(client.call).toHaveBeenCalledTimes(1);
        expect(response.payload.tokens).toEqual([
            expect.objectContaining({
                contract: KNOWN_TOKEN.toLowerCase(),
                balance: '500',
                symbol: 'USDC',
            }),
        ]);
        // Holding a token is enough to count as used.
        expect(response.payload.empty).toBe(false);
    });

    it('leaves tokens out when nothing is worth checking', async () => {
        mockGetKnownTokens.mockResolvedValue([]);
        const { client, asPublicClient } = createClient();

        const response = await getAccountInfo(
            createRequest({ client: asPublicClient, details: 'txs' }),
        );

        expect(client.call).not.toHaveBeenCalled();
        expect(response.payload.tokens).toBeUndefined();
    });

    it('reads a single contract on request and keeps reporting it afterwards, even at zero', async () => {
        const state = new WorkerState();
        const first = createClient({ contractReads: tokenEntries('HAND', 3n) });

        const filtered = await getAccountInfo(
            createRequest({
                client: first.asPublicClient,
                state,
                details: 'tokenBalances',
                contractFilter: HAND_ADDED_TOKEN,
            }),
        );

        expect(filtered.payload.tokens).toEqual([
            expect.objectContaining({ contract: HAND_ADDED_TOKEN, balance: '3', symbol: 'HAND' }),
        ]);

        const second = createClient({
            contractReads: [
                ...tokenEntries('HAND', 0n),
                ...tokenEntries('USDC', 0n),
                ...tokenEntries('USDT', 0n),
            ],
        });

        const listed = await getAccountInfo(
            createRequest({ client: second.asPublicClient, state, details: 'tokens' }),
        );

        expect(listed.payload.tokens).toEqual([
            expect.objectContaining({ contract: HAND_ADDED_TOKEN, balance: '0' }),
        ]);
    });
});
