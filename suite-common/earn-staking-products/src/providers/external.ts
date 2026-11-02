import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const externalProvider = stakingProviderSchema.parse({
    id: 'external',
    name: 'External',
    status: 'external',
    identities: {},
});
