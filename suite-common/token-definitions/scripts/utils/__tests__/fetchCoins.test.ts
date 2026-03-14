import * as blockfrostUtils from '@trezor/blockchain-link-blockfrost/src/utils';

import { getContractAddress } from '../fetchCoins';

describe('getContractAddress', () => {
    describe('Cardano platform', () => {
        it('should return policy ID for valid Cardano asset', () => {
            const platforms = {
                cardano: 'valid_cardano_asset_string',
            };

            const mockParseAsset = jest.spyOn(blockfrostUtils, 'parseAsset');
            mockParseAsset.mockReturnValue({ policyId: 'mock_policy_id' } as any);

            const result = getContractAddress('cardano', platforms);

            expect(result).toBe('mock_policy_id');
            expect(mockParseAsset).toHaveBeenCalledWith('valid_cardano_asset_string');

            mockParseAsset.mockRestore();
        });
    });

    describe('Stellar platform', () => {
        it('should handle uppercase code with hyphen separator', () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should handle lowercase code with hyphen separator', () => {
            const platforms = {
                stellar: 'usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(getContractAddress('stellar', platforms)).toBe(
                'usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should handle code with colon separator', () => {
            const platforms = {
                stellar: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should return undefined for invalid format', () => {
            const platforms = {
                stellar: 'INVALID_FORMAT',
            };
            expect(getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should return undefined for code too long', () => {
            const platforms = {
                stellar:
                    'VERYLONGCODENAME-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should return undefined for invalid issuer format', () => {
            const platforms = {
                stellar: 'USDC-AA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            };
            expect(getContractAddress('stellar', platforms)).toBeUndefined();
        });

        it('should handle format with numeric suffix', () => {
            const platforms = {
                stellar: 'BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY-1',
            };
            expect(getContractAddress('stellar', platforms)).toBe(
                'BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY',
            );
        });

        it('should handle format with multi-digit numeric suffix', () => {
            const platforms = {
                stellar: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-123',
            };
            expect(getContractAddress('stellar', platforms)).toBe(
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            );
        });

        it('should return undefined for format with non-numeric suffix', () => {
            const platforms = {
                stellar: 'TOKEN-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-abc',
            };
            expect(getContractAddress('stellar', platforms)).toBeUndefined();
        });
    });

    describe('Other platforms', () => {
        it('should return address as-is for other platforms', () => {
            const platforms = {
                ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            };
            expect(getContractAddress('ethereum', platforms)).toBe(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            );
        });

        it('should return address as-is for binance-smart-chain', () => {
            const platforms = {
                'binance-smart-chain': '0x55d398326f99059ff775485246999027b3197955',
            };
            expect(getContractAddress('binance-smart-chain', platforms)).toBe(
                '0x55d398326f99059ff775485246999027b3197955',
            );
        });
    });

    describe('Edge cases', () => {
        it('should return undefined when platform not found in platforms object', () => {
            const platforms = {
                ethereum: '0x1234567890abcdef',
            };
            expect(getContractAddress('polygon', platforms)).toBeUndefined();
        });

        it('should return undefined when platforms object is empty', () => {
            const platforms = {};
            expect(getContractAddress('ethereum', platforms)).toBeUndefined();
        });

        it('should return undefined when address is empty string', () => {
            const platforms = {
                ethereum: '',
            };
            expect(getContractAddress('ethereum', platforms)).toBeUndefined();
        });
    });
});
