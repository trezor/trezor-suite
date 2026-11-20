import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    getStakingAssetSymbol,
    stakingAssetSymbolSchema,
    stakingProductAssetSchema,
} from './stakingProductAsset';

const token = {
    kind: 'token',
    symbol: stakingAssetSymbolSchema.parse('pol'),
    contract: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
} as const;

describe('stakingProductAssetSchema', () => {
    it('parses a native asset', () => {
        expect(stakingProductAssetSchema.parse({ kind: 'native' })).toEqual({ kind: 'native' });
    });

    it('parses a token asset unchanged', () => {
        expect(stakingProductAssetSchema.parse(token)).toEqual(token);
    });

    it.each([
        ['without a contract', { ...token, contract: '' }],
        ['with an uppercase symbol', { ...token, symbol: 'POL' }],
        ['with an unknown key', { ...token, name: 'Polygon' }],
        ['with an unknown kind', { kind: 'nft' }],
    ])('rejects a token asset %s', (_name, value) => {
        expect(stakingProductAssetSchema.safeParse(value).success).toBe(false);
    });

    it('rejects a native asset with extra data', () => {
        expect(
            stakingProductAssetSchema.safeParse({ kind: 'native', contract: '0x' }).success,
        ).toBe(false);
    });
});

describe('getStakingAssetSymbol', () => {
    it('returns the network symbol for a native asset', () => {
        expect(
            getStakingAssetSymbol({
                networkSymbol: asNetworkSymbol('thod'),
                asset: { kind: 'native' },
            }),
        ).toBe('thod');
    });

    it('returns the token symbol for a token asset', () => {
        expect(getStakingAssetSymbol({ networkSymbol: asNetworkSymbol('eth'), asset: token })).toBe(
            'pol',
        );
    });
});
