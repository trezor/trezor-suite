import { buildRankedDefinitions } from './buildRankedDefinitions';

describe('buildRankedDefinitions', () => {
    it('should rank tokens from every platform in one list, largest market cap first', () => {
        const ranked = buildRankedDefinitions(
            new Map([
                [
                    'ethereum',
                    new Map([
                        ['0xusdc', 43_000_000_000],
                        ['0xtether', 139_000_000_000],
                    ]),
                ],
                ['solana', new Map([['SoWrappedSol', 90_000_000_000]])],
            ]),
        );

        expect(ranked).toEqual([
            { assetPlatformId: 'ethereum', address: '0xtether', marketCap: 139_000_000_000 },
            { assetPlatformId: 'solana', address: 'SoWrappedSol', marketCap: 90_000_000_000 },
            { assetPlatformId: 'ethereum', address: '0xusdc', marketCap: 43_000_000_000 },
        ]);
    });

    it('should leave out tokens CoinGecko reports no market cap for', () => {
        const ranked = buildRankedDefinitions(
            new Map([
                [
                    'ethereum',
                    new Map([
                        ['0xusdc', 43_000_000_000],
                        ['0xobscure', 0],
                    ]),
                ],
            ]),
        );

        expect(ranked).toEqual([
            { assetPlatformId: 'ethereum', address: '0xusdc', marketCap: 43_000_000_000 },
        ]);
    });

    it('should order tokens sharing a market cap by platform and address, so that reruns match', () => {
        const ranked = buildRankedDefinitions(
            new Map([
                ['solana', new Map([['SoSecond', 100]])],
                [
                    'ethereum',
                    new Map([
                        ['0xsecond', 100],
                        ['0xfirst', 100],
                    ]),
                ],
            ]),
        );

        expect(
            ranked.map(({ assetPlatformId, address }) => `${assetPlatformId}:${address}`),
        ).toEqual(['ethereum:0xfirst', 'ethereum:0xsecond', 'solana:SoSecond']);
    });

    it('should return an empty list when no token has a market cap', () => {
        expect(
            buildRankedDefinitions(new Map([['ethereum', new Map([['0xobscure', 0]])]])),
        ).toEqual([]);
    });
});
