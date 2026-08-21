import {
    type PublicClient,
    decodeAbiParameters,
    encodeAbiParameters,
    parseAbiParameters,
} from 'viem';

import { getTokenInfo } from './tokenInfo';

const USER = '0x1234567890123456789012345678901234567890' as const;
const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';

const encodeUint = (value: bigint) => encodeAbiParameters(parseAbiParameters('uint256'), [value]);
const encodeString = (value: string) => encodeAbiParameters(parseAbiParameters('string'), [value]);
const encodeUint8 = (value: number) => encodeAbiParameters(parseAbiParameters('uint8'), [value]);
const encodeBool = (value: boolean) => encodeAbiParameters(parseAbiParameters('bool'), [value]);

type Entry = { success: boolean; returnData: `0x${string}` };

const encodeAggregate3 = (entries: Entry[]) =>
    encodeAbiParameters(parseAbiParameters('(bool success, bytes returnData)[]'), [entries]);

const ok = (returnData: `0x${string}`): Entry => ({ success: true, returnData });
const reverted: Entry = { success: false, returnData: '0x' };

const innerCallCount = (data: `0x${string}`) => {
    const [calls] = decodeAbiParameters(
        parseAbiParameters('(address target, bool allowFailure, bytes callData)[]'),
        `0x${data.slice(10)}` as `0x${string}`,
    );

    return (calls as readonly unknown[]).length;
};

// balanceOf, name, symbol, decimals, supportsInterface(ERC721), supportsInterface(ERC1155)
const fullResponse = ({
    balance = 500n,
    isErc721 = false,
    isErc1155 = false,
}: { balance?: bigint; isErc721?: boolean; isErc1155?: boolean } = {}) =>
    encodeAggregate3([
        ok(encodeUint(balance)),
        ok(encodeString('USD Coin')),
        ok(encodeString('USDC')),
        ok(encodeUint8(6)),
        ok(encodeBool(isErc721)),
        ok(encodeBool(isErc1155)),
    ]);

const createClient = () => {
    const client = {
        getCode: jest.fn().mockResolvedValue('0x6080604052'),
        call: jest.fn().mockResolvedValue({ data: fullResponse() }),
    };

    return { client, asPublicClient: client as unknown as PublicClient };
};

describe('getTokenInfo', () => {
    it('reads balance and metadata in a single Multicall3 request', async () => {
        const { client, asPublicClient } = createClient();

        const token = await getTokenInfo(asPublicClient, USER, TOKEN, true);

        expect(client.call).toHaveBeenCalledTimes(1);

        const [{ to, data }] = client.call.mock.calls[0];
        expect(to).toBe(MULTICALL3);
        expect(innerCallCount(data)).toBe(6);

        expect(token).toEqual({
            standard: 'ERC20',
            contract: TOKEN.toLowerCase(),
            balance: '500',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
        });
    });

    it('refetches only the balance once metadata is cached', async () => {
        const { client, asPublicClient } = createClient();

        await getTokenInfo(asPublicClient, USER, TOKEN, true);

        client.call.mockResolvedValue({ data: encodeAggregate3([ok(encodeUint(900n))]) });

        const token = await getTokenInfo(asPublicClient, USER, TOKEN, true);

        expect(client.call).toHaveBeenCalledTimes(2);
        expect(innerCallCount(client.call.mock.calls[1][0].data)).toBe(1);

        // Balance is fresh, metadata comes from the cache.
        expect(token).toEqual({
            standard: 'ERC20',
            contract: TOKEN.toLowerCase(),
            balance: '900',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
        });
    });

    it('caches metadata per client, not globally', async () => {
        const first = createClient();
        const second = createClient();

        await getTokenInfo(first.asPublicClient, USER, TOKEN, true);
        await getTokenInfo(second.asPublicClient, USER, TOKEN, true);

        expect(innerCallCount(second.client.call.mock.calls[0][0].data)).toBe(6);
    });

    it('detects ERC721 and ERC1155 from the batched interface queries', async () => {
        const erc721 = createClient();
        erc721.client.call.mockResolvedValue({ data: fullResponse({ isErc721: true }) });
        const erc1155 = createClient();
        erc1155.client.call.mockResolvedValue({ data: fullResponse({ isErc1155: true }) });

        await expect(getTokenInfo(erc721.asPublicClient, USER, TOKEN, true)).resolves.toMatchObject(
            { standard: 'ERC721' },
        );
        await expect(
            getTokenInfo(erc1155.asPublicClient, USER, TOKEN, true),
        ).resolves.toMatchObject({ standard: 'ERC1155' });
    });

    it('falls back to unknown metadata when those calls revert', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                ok(encodeUint(1n)),
                reverted,
                reverted,
                reverted,
                reverted,
                reverted,
            ]),
        });

        await expect(getTokenInfo(asPublicClient, USER, TOKEN, true)).resolves.toEqual({
            standard: 'ERC20',
            contract: TOKEN.toLowerCase(),
            balance: '1',
            name: 'unknown',
            symbol: 'unknown',
            decimals: 0,
        });
    });

    it('does not cache placeholder metadata when the whole batch fails to read', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValueOnce({
            data: encodeAggregate3([reverted, reverted, reverted, reverted, reverted, reverted]),
        });

        await expect(getTokenInfo(asPublicClient, USER, TOKEN, true)).resolves.toMatchObject({
            name: 'unknown',
            decimals: 0,
        });

        // The next poll re-reads metadata instead of serving the placeholders forever.
        const token = await getTokenInfo(asPublicClient, USER, TOKEN, true);

        expect(innerCallCount(client.call.mock.calls[1][0].data)).toBe(6);
        expect(token).toMatchObject({ name: 'USD Coin', symbol: 'USDC', decimals: 6 });
    });

    it('does not cache metadata when only decimals failed to read', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValueOnce({
            data: encodeAggregate3([
                ok(encodeUint(5n)),
                ok(encodeString('USD Coin')),
                ok(encodeString('USDC')),
                reverted,
                ok(encodeBool(false)),
                ok(encodeBool(false)),
            ]),
        });

        // Caching 0 here would render every amount 10^6 too large for the rest of the connection.
        await expect(getTokenInfo(asPublicClient, USER, TOKEN, true)).resolves.toMatchObject({
            decimals: 0,
        });

        const token = await getTokenInfo(asPublicClient, USER, TOKEN, true);

        expect(innerCallCount(client.call.mock.calls[1][0].data)).toBe(6);
        expect(token).toMatchObject({ decimals: 6 });
    });

    it('caches NFT metadata even though decimals cannot be read', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                ok(encodeUint(1n)),
                ok(encodeString('CryptoPunks')),
                ok(encodeString('PUNK')),
                reverted,
                ok(encodeBool(true)),
                ok(encodeBool(false)),
            ]),
        });

        await getTokenInfo(asPublicClient, USER, TOKEN, true);
        const token = await getTokenInfo(asPublicClient, USER, TOKEN, true);

        expect(innerCallCount(client.call.mock.calls[1][0].data)).toBe(1);
        expect(token).toMatchObject({ standard: 'ERC721', decimals: 0 });
    });

    it('returns null for a zero balance unless the check is skipped', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({ data: fullResponse({ balance: 0n }) });

        await expect(getTokenInfo(asPublicClient, USER, TOKEN)).resolves.toBeNull();
        await expect(getTokenInfo(asPublicClient, USER, TOKEN, true)).resolves.toMatchObject({
            balance: '0',
        });
    });
});
