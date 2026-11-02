import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductIdParts,
    getStakingProductId,
    parseStakingProductId,
    stakingProductIdSchema,
} from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

const parts: StakingProductIdParts = {
    symbol: asNetworkSymbol('eth'),
    providerId: stakingProviderIdSchema.parse('everstake'),
    type: 'pooled',
};

describe('staking product id', () => {
    it('joins symbol, provider and type', () => {
        expect(getStakingProductId(parts)).toBe('eth:everstake:pooled');
    });

    it('parses what it builds', () => {
        expect(parseStakingProductId(getStakingProductId(parts))).toEqual(parts);
    });

    it('keeps dots and hyphens in provider ids', () => {
        expect(parseStakingProductId('trx:p2p.org:native')).toEqual({
            symbol: 'trx',
            providerId: 'p2p.org',
            type: 'native',
        });
    });

    it.each([
        'eth:everstake',
        'eth:everstake:pooled:extra',
        'eth:everstake:unknown',
        'eth::pooled',
        ':everstake:pooled',
        'eth:Everstake:pooled',
        'eth:ever stake:pooled',
        '',
    ])('rejects %j', value => {
        expect(parseStakingProductId(value)).toBeNull();
        expect(stakingProductIdSchema.safeParse(value).success).toBe(false);
    });

    it('parses a valid id through the schema unchanged', () => {
        expect(stakingProductIdSchema.parse('sol:everstake:native')).toBe('sol:everstake:native');
    });

    it('names the expected form when an id is invalid', () => {
        const result = stakingProductIdSchema.safeParse('sol-everstake-native');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe(
            'Expected a staking product id in the form symbol:provider:type',
        );
    });
});
