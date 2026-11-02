import { asNetworkSymbol } from '@trezor/network-module-types';

import { type StakingProvider, stakingProviderIdSchema } from '../src';

type ActiveStakingProvider = Extract<StakingProvider, { status: 'active' }>;

export const mockStakingProvider = (
    overrides: Partial<ActiveStakingProvider> = {},
): StakingProvider => ({
    id: stakingProviderIdSchema.parse('everstake'),
    name: 'Everstake',
    status: 'active',
    links: { website: 'https://everstake.one' },
    identities: {
        [asNetworkSymbol('eth')]: ['Everstake'],
        [asNetworkSymbol('sol')]: ['9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF'],
    },
    ...overrides,
});
