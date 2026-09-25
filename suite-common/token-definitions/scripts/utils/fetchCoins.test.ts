import { blockfrostUtils } from '@trezor/blockchain-link-utils';
import { err, ok } from '@trezor/type-utils';

import { REQUEST_RETRY_GAPS_MS } from '../constants';
import { getContractAddress } from './fetchCoins';

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
        jest.useRealTimers();
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

            expect(result).toEqual(ok('mock_policy_id'));
            expect(mockParseAsset).toHaveBeenCalledWith('valid_cardano_asset_string');
        });
    });

    describe('Stellar platform', () => {
        it('should handle uppercase code with hyphen separator', async () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
            );
        });

        it('should handle lowercase code with hyphen separator', async () => {
            const platforms = {
                stellar: 'usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
            );
        });

        it('should handle code with colon separator', async () => {
            const platforms = {
                stellar: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
            );
        });

        it('should reject an address that is neither a classic asset nor a contract', async () => {
            const platforms = {
                stellar: 'INVALID_FORMAT',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: platforms.stellar }),
            );
        });

        it('should reject a code longer than the Stellar limit', async () => {
            const platforms = {
                stellar:
                    'VERYLONGCODENAME-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: platforms.stellar }),
            );
        });

        it('should reject an issuer that is not a Stellar account', async () => {
            const platforms = {
                stellar: 'USDC-AA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: platforms.stellar }),
            );
        });

        it('should handle format with numeric suffix', async () => {
            const platforms = {
                stellar: 'BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY-1',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY'),
            );
        });

        it('should handle format with multi-digit numeric suffix', async () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-123',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
            );
        });

        it('should reject a non-numeric suffix', async () => {
            const platforms = {
                stellar: 'TOKEN-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-abc',
            };
            expect(await getContractAddress('stellar', platforms)).toEqual(
                err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: platforms.stellar }),
            );
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

            expect(await getContractAddress('stellar', platforms)).toEqual(
                ok('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
            );
            expect(fetchSpy).toHaveBeenCalledWith(
                `https://api.stellar.expert/explorer/public/contract/${sorobanAddress}`,
                expect.objectContaining({ signal: expect.anything() }),
            );
        });

        it('should report an unsupported format when the API returns an unusable asset', async () => {
            const sorobanAddress = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
            const platforms = { stellar: sorobanAddress };

            jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            jest.spyOn(global, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ asset: 'INVALID_FORMAT' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            expect(await getContractAddress('stellar', platforms)).toEqual(
                err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: 'INVALID_FORMAT' }),
            );
        });
    });

    describe('Soroban lookups that do not answer', () => {
        const sorobanAddress = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
        const usdc = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

        const mockStellarExpert = (...responses: Response[]) => {
            const fetchSpy = jest.spyOn(global, 'fetch');
            responses.forEach(response => fetchSpy.mockResolvedValueOnce(response));

            return fetchSpy;
        };

        const assetResponse = () =>
            new Response(JSON.stringify({ asset: `${usdc}-1` }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });

        it('should retry a rate limited lookup rather than lose the asset', async () => {
            jest.useFakeTimers();
            jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            const fetchSpy = mockStellarExpert(
                new Response('Too Many Requests', { status: 429 }),
                assetResponse(),
            );

            const resultPromise = getContractAddress('stellar', { stellar: sorobanAddress });
            await jest.runAllTimersAsync();

            expect(await resultPromise).toEqual(ok(usdc));
            expect(fetchSpy).toHaveBeenCalledTimes(2);
        });

        it('should report a failed lookup, so the asset is never silently dropped', async () => {
            jest.useFakeTimers();
            jest.spyOn(console, 'warn').mockImplementation(() => undefined);
            const fetchSpy = jest
                .spyOn(global, 'fetch')
                .mockImplementation(() =>
                    Promise.resolve(new Response('Too Many Requests', { status: 429 })),
                );

            const resultPromise = getContractAddress('stellar', { stellar: sorobanAddress });
            await jest.runAllTimersAsync();
            const result = await resultPromise;

            expect(result.success).toBe(false);
            expect(result.success === false && result.error.type).toBe('LOOKUP_FAILED');
            expect(fetchSpy).toHaveBeenCalledTimes(REQUEST_RETRY_GAPS_MS.length);
        });

        it('should treat a contract the API does not know as an answer, not a failure', async () => {
            mockStellarExpert(new Response('Not Found', { status: 404 }));

            expect(await getContractAddress('stellar', { stellar: sorobanAddress })).toEqual(
                err({ type: 'CONTRACT_HAS_NO_ASSET', contractAddress: sorobanAddress }),
            );
        });
    });

    describe('Other platforms', () => {
        it('should return address as-is for other platforms', async () => {
            const platforms = {
                ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            };
            expect(await getContractAddress('ethereum', platforms)).toEqual(
                ok('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
            );
        });

        it('should return address as-is for binance-smart-chain', async () => {
            const platforms = {
                'binance-smart-chain': '0x55d398326f99059ff775485246999027b3197955',
            };
            expect(await getContractAddress('binance-smart-chain', platforms)).toEqual(
                ok('0x55d398326f99059ff775485246999027b3197955'),
            );
        });
    });

    describe('Edge cases', () => {
        it('should report a coin that is not on the platform', async () => {
            const platforms = {
                ethereum: '0x1234567890abcdef',
            };
            expect(await getContractAddress('polygon', platforms)).toEqual(
                err({ type: 'NOT_ON_PLATFORM' }),
            );
        });

        it('should report a coin with no platforms at all', async () => {
            const platforms = {};
            expect(await getContractAddress('ethereum', platforms)).toEqual(
                err({ type: 'NOT_ON_PLATFORM' }),
            );
        });

        it('should report an empty address as not on the platform', async () => {
            const platforms = {
                ethereum: '',
            };
            expect(await getContractAddress('ethereum', platforms)).toEqual(
                err({ type: 'NOT_ON_PLATFORM' }),
            );
        });
    });
});
