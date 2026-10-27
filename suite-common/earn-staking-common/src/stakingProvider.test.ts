import { asNetworkSymbol } from '@trezor/network-module-types';

import { stakingProviderIdSchema, stakingProviderSchema } from './stakingProvider';
import { mockStakingProvider } from '../mocks';

describe('stakingProviderSchema', () => {
    it('parses a provider unchanged', () => {
        const provider = mockStakingProvider();

        expect(stakingProviderSchema.parse(provider)).toEqual(provider);
    });

    it('allows identities for a subset of networks', () => {
        const provider = mockStakingProvider({
            identities: { [asNetworkSymbol('ada')]: ['pool1'] },
        });

        expect(stakingProviderSchema.parse(provider).identities).toEqual({ ada: ['pool1'] });
    });

    it('accepts an external provider without links', () => {
        const provider = {
            id: stakingProviderIdSchema.parse('lido'),
            name: 'Lido',
            status: 'external',
            identities: {},
        };

        expect(stakingProviderSchema.parse(provider)).toEqual(provider);
    });

    it('rejects an active provider without a website', () => {
        const result = stakingProviderSchema.safeParse({ ...mockStakingProvider(), links: {} });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['links', 'website']);
    });

    it.each(['Everstake', 'ever:stake', '-everstake', ''])('rejects the provider id %j', id => {
        const result = stakingProviderSchema.safeParse({ ...mockStakingProvider(), id });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown key', () => {
        const result = stakingProviderSchema.safeParse({ ...mockStakingProvider(), logo: 'x' });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
    });

    it('rejects an unknown status', () => {
        const result = stakingProviderSchema.safeParse({
            ...mockStakingProvider(),
            status: 'paused',
        });

        expect(result.success).toBe(false);
    });
});
