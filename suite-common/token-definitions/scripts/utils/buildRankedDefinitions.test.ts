import { type CoinData } from '../schemas';
import { type TokenCandidates } from './buildRankedDefinitions';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

// The API clients capture `globalThis.fetch` when the module under test is first evaluated, so the
// mock above has to be installed before that happens — hence the require instead of a top-level
// import, which would be hoisted above the assignment.
const { buildRankedDefinitions, collectPlatformTokens, rankTokens } =
    require('./buildRankedDefinitions') as typeof import('./buildRankedDefinitions');

const candidate = (coinId: string, symbol: string, name: string) => ({ coinId, symbol, name });

const platform = (tokens: Record<string, TokenCandidates>) => new Map(Object.entries(tokens));

describe(rankTokens.name, () => {
    it('should rank tokens from every platform in one list, largest market cap first', () => {
        const ranked = rankTokens({
            tokensByPlatform: new Map([
                [
                    'ethereum',
                    platform({
                        '0xusdc': [candidate('usd-coin', 'usdc', 'USD Coin')],
                        '0xtether': [candidate('tether', 'usdt', 'Tether')],
                    }),
                ],
                ['solana', platform({ SoWSol: [candidate('wsol', 'wsol', 'Wrapped SOL')] })],
            ]),
            marketCaps: new Map([
                ['usd-coin', 43_000_000_000],
                ['tether', 139_000_000_000],
                ['wsol', 90_000_000_000],
            ]),
        });

        expect(ranked.map(({ symbol, marketCap }) => [symbol, marketCap])).toEqual([
            ['usdt', 139_000_000_000],
            ['wsol', 90_000_000_000],
            ['usdc', 43_000_000_000],
        ]);
    });

    it('should keep a token with no market cap, ranked last with a market cap of 0', () => {
        const ranked = rankTokens({
            tokensByPlatform: new Map([
                [
                    'ethereum',
                    platform({
                        '0xobscure': [candidate('obscure-coin', 'obs', 'Obscure Coin')],
                        '0xusdc': [candidate('usd-coin', 'usdc', 'USD Coin')],
                    }),
                ],
            ]),
            marketCaps: new Map([['usd-coin', 43_000_000_000]]),
        });

        expect(ranked).toEqual([
            {
                assetPlatformId: 'ethereum',
                address: '0xusdc',
                symbol: 'usdc',
                name: 'USD Coin',
                marketCap: 43_000_000_000,
            },
            {
                assetPlatformId: 'ethereum',
                address: '0xobscure',
                symbol: 'obs',
                name: 'Obscure Coin',
                marketCap: 0,
            },
        ]);
    });

    it('should keep the record of the largest coin when several share a contract address', () => {
        const ranked = rankTokens({
            tokensByPlatform: new Map([
                [
                    'cardano',
                    platform({
                        policyId: [
                            candidate('ibtc', 'ibtc', 'iBTC'),
                            candidate('iusd', 'iusd', 'iUSD'),
                            candidate('ieth', 'ieth', 'iETH'),
                        ],
                    }),
                ],
            ]),
            marketCaps: new Map([['iusd', 9_340_607]]),
        });

        // The symbol and name must belong to the coin whose market cap was kept, otherwise the
        // ranked definitions would label a market cap with another token's identity.
        expect(ranked).toEqual([
            {
                assetPlatformId: 'cardano',
                address: 'policyId',
                symbol: 'iusd',
                name: 'iUSD',
                marketCap: 9_340_607,
            },
        ]);
    });

    it('should break a collision tie by coin id, so the choice ignores CoinGecko ordering', () => {
        const tokensByPlatform = new Map([
            [
                'cardano',
                platform({
                    policyId: [
                        candidate('shen', 'shen', 'Shen'),
                        candidate('djed', 'djed', 'Djed'),
                    ],
                }),
            ],
        ]);

        expect(rankTokens({ tokensByPlatform, marketCaps: new Map() })).toEqual([
            {
                assetPlatformId: 'cardano',
                address: 'policyId',
                symbol: 'djed',
                name: 'Djed',
                marketCap: 0,
            },
        ]);
    });

    it('should order tokens sharing a market cap by platform and address, so that reruns match', () => {
        const ranked = rankTokens({
            tokensByPlatform: new Map([
                ['solana', platform({ SoSecond: [candidate('two', 'two', 'Second')] })],
                [
                    'ethereum',
                    platform({
                        '0xsecond': [candidate('three', 'three', 'Third')],
                        '0xfirst': [candidate('one', 'one', 'First')],
                    }),
                ],
            ]),
            marketCaps: new Map([
                ['one', 100],
                ['two', 100],
                ['three', 100],
            ]),
        });

        expect(
            ranked.map(({ assetPlatformId, address }) => `${assetPlatformId}:${address}`),
        ).toEqual(['ethereum:0xfirst', 'ethereum:0xsecond', 'solana:SoSecond']);
    });
});

describe(collectPlatformTokens.name, () => {
    const usdCoin: CoinData = {
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USD Coin',
        platforms: { ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    };
    const coinOnAnotherPlatform: CoinData = {
        id: 'solana-coin',
        symbol: 'sol',
        name: 'Solana Coin',
        platforms: { solana: 'So11111111111111111111111111111111111111112' },
    };

    it('should keep only the coins listed on the platform', async () => {
        const tokens = await collectPlatformTokens([usdCoin, coinOnAnotherPlatform], 'ethereum');

        expect(tokens).toEqual(
            new Map([
                [
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    [{ coinId: 'usd-coin', symbol: 'usdc', name: 'USD Coin' }],
                ],
            ]),
        );
    });

    it('should collect every coin that resolves to the same contract address', async () => {
        const otherCoin: CoinData = { ...usdCoin, id: 'bridged-usdc', symbol: 'usdc.e' };

        const tokens = await collectPlatformTokens([usdCoin, otherCoin], 'ethereum');

        expect(tokens.get('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toHaveLength(2);
    });
});

const jsonResponse = (data: unknown) =>
    new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

const tether = {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    platforms: { ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
};
const obscureCoin = {
    id: 'obscure-coin',
    symbol: 'obs',
    name: 'Obscure Coin',
    platforms: { ethereum: '0x0000000000000000000000000000000000000001' },
};

type RespondParams = {
    coins?: unknown[];
    markets?: unknown[] | 'fails';
};

const respondWith = ({ coins = [tether, obscureCoin], markets = [] }: RespondParams) => {
    fetchMock.mockImplementation((request: Request) => {
        const { pathname } = new URL(request.url);

        if (pathname.endsWith('/coins/list')) return Promise.resolve(jsonResponse(coins));
        if (pathname.endsWith('/coins/markets')) {
            return Promise.resolve(
                markets === 'fails'
                    ? new Response('Too Many Requests', { status: 429 })
                    : jsonResponse(markets),
            );
        }

        return Promise.reject(new Error(`Unexpected request: ${request.url}`));
    });
};

describe(buildRankedDefinitions.name, () => {
    beforeAll(() => {
        process.env.COINGECKO_API_KEY = 'test-key';
    });

    beforeEach(() => {
        fetchMock.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('should rank the tokens of a platform by market cap', async () => {
        respondWith({ markets: [{ id: 'tether', market_cap: 139_000_000_000 }] });

        const ranked = await buildRankedDefinitions(['ethereum']);

        expect(ranked.map(({ symbol, marketCap }) => [symbol, marketCap])).toEqual([
            ['usdt', 139_000_000_000],
            // CoinGecko answered about this one: it has no market cap, so it ranks last.
            ['obs', 0],
        ]);
    });

    // The point of the whole retry-then-throw path: a token whose market cap could not be fetched
    // must never be published at the bottom of the ranking as though its market cap were 0.
    it('should produce nothing when the market caps cannot be fetched', async () => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        respondWith({ markets: 'fails' });

        const settled = buildRankedDefinitions(['ethereum']).catch((error: unknown) => error);
        await jest.runAllTimersAsync();

        expect(await settled).toBeInstanceOf(Error);
    });

    it('should throw when a platform has no tokens at all', async () => {
        respondWith({ coins: [] });

        await expect(buildRankedDefinitions(['ethereum'])).rejects.toThrow('ethereum');
    });

    it('should ask about each coin once, however many platforms it is listed on', async () => {
        const multiChainCoin = {
            ...tether,
            platforms: {
                ...tether.platforms,
                solana: 'SoTether11111111111111111111111111111111111',
            },
        };
        respondWith({ coins: [multiChainCoin], markets: [{ id: 'tether', market_cap: 1 }] });

        await buildRankedDefinitions(['ethereum', 'solana']);

        const marketRequests = fetchMock.mock.calls.filter(([request]) =>
            String((request as Request).url).includes('/coins/markets'),
        );
        expect(marketRequests).toHaveLength(1);
        expect(
            new URL(String((marketRequests[0]![0] as Request).url)).searchParams.get('ids'),
        ).toBe('tether');
    });
});
