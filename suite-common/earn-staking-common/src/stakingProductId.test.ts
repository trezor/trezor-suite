import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductIdParts,
    getStakingProductId,
    parseStakingProductId,
    stakingProductIdSchema,
} from './stakingProductId';
import { asStakingProviderId } from './stakingProvider';

const parts: StakingProductIdParts = {
    symbol: asNetworkSymbol('eth'),
    providerId: asStakingProviderId('everstake'),
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
});
