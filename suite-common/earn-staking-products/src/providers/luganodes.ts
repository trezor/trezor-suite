import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const luganodesProvider = stakingProviderSchema.parse({
    id: 'luganodes',
    name: 'Luganodes',
    status: 'active',
    links: {
        website: 'https://luganodes.com',
        terms: 'https://luganodes.com/terms-of-service',
    },
    identities: {
        trx: ['TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9'],
    },
});
