import { asNetworkSymbol } from '@trezor/network-module-types';

import { stakingAssetSymbolSchema } from './stakingProductAsset';
import {
    type StakingProductIdInput,
    getStakingProductId,
    parseStakingProductId,
    stakingProductIdSchema,
} from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

const native: StakingProductIdInput = {
    networkSymbol: asNetworkSymbol('eth'),
    asset: { kind: 'native' },
    providerId: stakingProviderIdSchema.parse('everstake'),
    type: 'pooled',
};

const token: StakingProductIdInput = {
    ...native,
    asset: {
        kind: 'token',
        symbol: stakingAssetSymbolSchema.parse('pol'),
        contract: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
    },
    type: 'native',
};

describe('staking product id', () => {
    it('uses the network symbol as the asset of a native product', () => {
        expect(getStakingProductId(native)).toBe('eth:eth:everstake:pooled');
    });

    it('uses the token symbol as the asset of a token product', () => {
        expect(getStakingProductId(token)).toBe('eth:pol:everstake:native');
    });

    it('parses what it builds', () => {
        expect(parseStakingProductId(getStakingProductId(token))).toEqual({
            networkSymbol: 'eth',
            assetSymbol: 'pol',
            providerId: 'everstake',
            type: 'native',
        });
    });

    it('keeps dots and hyphens in provider ids', () => {
        expect(parseStakingProductId('trx:trx:p2p.org:native')).toEqual({
            networkSymbol: 'trx',
            assetSymbol: 'trx',
            providerId: 'p2p.org',
            type: 'native',
        });
    });

    it.each([
        'eth:everstake:pooled',
        'eth:eth:everstake:pooled:extra',
        'eth:eth:everstake:unknown',
        'eth::everstake:pooled',
        'eth:POL:everstake:native',
        'eth:eth:Everstake:pooled',
        'eth:eth:ever stake:pooled',
        ':eth:everstake:pooled',
        '',
    ])('rejects %j', value => {
        expect(parseStakingProductId(value)).toBeNull();
        expect(stakingProductIdSchema.safeParse(value).success).toBe(false);
    });

    it('parses a valid id through the schema unchanged', () => {
        expect(stakingProductIdSchema.parse('sol:sol:everstake:native')).toBe(
            'sol:sol:everstake:native',
        );
    });

    it('names the expected form when an id is invalid', () => {
        const result = stakingProductIdSchema.safeParse('sol-everstake-native');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe(
            'Expected a staking product id in the form symbol:asset:provider:type',
        );
    });
});
