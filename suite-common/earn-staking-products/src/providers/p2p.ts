import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const p2pProvider = stakingProviderSchema.parse({
    id: 'p2p.org',
    name: 'P2P.org',
    status: 'active',
    links: {
        website: 'https://www.p2p.org',
        terms: 'https://www.p2p.org/terms-of-use',
    },
    identities: {
        trx: ['TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij'],
    },
});
