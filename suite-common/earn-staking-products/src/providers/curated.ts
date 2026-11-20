import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const curatedProvider = stakingProviderSchema.parse({
    id: 'curated',
    name: 'Trezor',
    status: 'curated',
    identities: {},
});
