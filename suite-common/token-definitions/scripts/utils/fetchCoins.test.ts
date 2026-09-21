import { blockfrostUtils } from '@trezor/blockchain-link-utils';

import { TokenStructureType } from '../../src/tokenDefinitionsTypes';
import { CoinData } from '../types';
import { buildCoinDataForPlatform, getContractAddress } from './fetchCoins';

jest.mock('@trezor/blockchain-link-utils', () => ({
    ...jest.requireActual('@trezor/blockchain-link-utils'),
    blockfrostUtils: {
        ...jest.requireActual('@trezor/blockchain-link-utils').blockfrostUtils,
        parseAsset: jest.fn(
            jest.requireActual('@trezor/blockchain-link-utils').blockfrostUtils.parseAsset,
        ),
    },
}));

describe('getContractAddress', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Cardano platform', () => {
        it('should return policy ID for valid Cardano asset', async () => {
            const platforms = {
                cardano: 'valid_cardano_asset_string',
            };

            const mockParseAsset = blockfrostUtils.parseAsset as jest.Mock;
            mockParseAsset.mockReturnValue({ policyId: 'mock_policy_id' } as any);

            const result = await getContractAddress('cardano', platforms);

            expect(result).toBe('mock_policy_id');
            expect(mockParseAsset).toHaveBeenCalledWith('valid_cardano_asset_string');
        });
    });

    describe('Stellar platform', () => {
        it('should handle uppercase code with hyphen separator', async () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should handle lowercase code with hyphen separator', async () => {
            const platforms = {
                stellar: 'usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toBe(
                'usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should handle code with colon separator', async () => {
            const platforms = {
                stellar: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should return undefined for invalid format', async () => {
            const platforms = {
                stellar: 'INVALID_FORMAT',
            };
            expect(await getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should return undefined for code too long', async () => {
            const platforms = {
                stellar:
                    'VERYLONGCODENAME-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should return undefined for invalid issuer format', async () => {
            const platforms = {
                stellar: 'USDC-AA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should handle format with numeric suffix', async () => {
            const platforms = {
                stellar: 'BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY-1',
            };
            expect(await getContractAddress('stellar', platforms)).toBe(
                'BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY',
            );
        });

        it('should handle format with multi-digit numeric suffix', async () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-123',
            };
            expect(await getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should return undefined for format with non-numeric suffix', async () => {
            const platforms = {
                stellar: 'TOKEN-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-abc',
            };
            expect(await getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should resolve Soroban contract address via StellarExpert API', async () => {
            const sorobanAddress = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
            const platforms = { stellar: sorobanAddress };

            const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
                new Response(
                    JSON.stringify({
                        asset: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-1',
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } },
                ),
            );

            expect(await getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
            expect(fetchSpy).toHaveBeenCalledWith(
                `https://api.stellar.expert/explorer/public/contract/${sorobanAddress}`,
            );
        });

        it('should return undefined for Soroban contract with invalid asset from API', async () => {
            const sorobanAddress = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
            const platforms = { stellar: sorobanAddress };

            jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            jest.spyOn(global, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ asset: 'INVALID_FORMAT' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            expect(await getContractAddress('stellar', platforms)).toBeUndefined();
        });
    });

    describe('Other platforms', () => {
        it('should return address as-is for other platforms', async () => {
            const platforms = {
                ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            };
            expect(await getContractAddress('ethereum', platforms)).toBe(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            );
        });

        it('should return address as-is for binance-smart-chain', async () => {
            const platforms = {
                'binance-smart-chain': '0x55d398326f99059ff775485246999027b3197955',
            };
            expect(await getContractAddress('binance-smart-chain', platforms)).toBe(
                '0x55d398326f99059ff775485246999027b3197955',
            );
        });
    });

    describe('Edge cases', () => {
        it('should return undefined when platform not found in platforms object', async () => {
            const platforms = {
                ethereum: '0x1234567890abcdef',
            };
            expect(await getContractAddress('polygon', platforms)).toBeUndefined();
        });

        it('should return undefined when platforms object is empty', async () => {
            const platforms = {};
            expect(await getContractAddress('ethereum', platforms)).toBeUndefined();
        });

        it('should return undefined when address is empty string', async () => {
            const platforms = {
                ethereum: '',
            };
            expect(await getContractAddress('ethereum', platforms)).toBeUndefined();
        });
    });
});

describe('buildCoinDataForPlatform', () => {
    const usdCoin: CoinData = {
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USD Coin',
        platforms: { ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    };
    const obscureCoin: CoinData = {
        id: 'obscure-coin',
        symbol: 'obs',
        name: 'Obscure Coin',
        platforms: { ethereum: '0x0000000000000000000000000000000000000001' },
    };
    const coinOnAnotherPlatform: CoinData = {
        id: 'solana-coin',
        symbol: 'sol',
        name: 'Solana Coin',
        platforms: { solana: 'So11111111111111111111111111111111111111112' },
    };

    describe('simple structure', () => {
        it('should map every contract address to its market cap', async () => {
            const result = await buildCoinDataForPlatform({
                allCoins: [usdCoin, coinOnAnotherPlatform],
                assetPlatformId: 'ethereum',
                structure: TokenStructureType.SIMPLE,
                marketCaps: new Map([['usd-coin', 43_000_000_000]]),
            });

            expect(result).toEqual(
                new Map([['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 43_000_000_000]]),
            );
        });

        it('should use a zero market cap for a coin CoinGecko reports no market cap for', async () => {
            const result = await buildCoinDataForPlatform({
                allCoins: [obscureCoin],
                assetPlatformId: 'ethereum',
                structure: TokenStructureType.SIMPLE,
                marketCaps: new Map(),
            });

            expect(result).toEqual(new Map([['0x0000000000000000000000000000000000000001', 0]]));
        });

        it('should keep the highest market cap when several coins share a contract address', async () => {
            const duplicate: CoinData = { ...obscureCoin, id: 'duplicate-coin' };

            const result = await buildCoinDataForPlatform({
                allCoins: [duplicate, obscureCoin],
                assetPlatformId: 'ethereum',
                structure: TokenStructureType.SIMPLE,
                marketCaps: new Map([['duplicate-coin', 500]]),
            });

            expect(result).toEqual(new Map([['0x0000000000000000000000000000000000000001', 500]]));
        });
    });
});
