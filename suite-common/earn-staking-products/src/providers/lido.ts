import { stakingProviderSchema } from '@suite-common/earn-staking-common';

export const lidoProvider = stakingProviderSchema.parse({
    id: 'lido',
    name: 'Lido',
    status: 'active',
    links: { website: 'https://lido.fi' },
    identities: {
        // The wstETH token contract.
        eth: ['0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'],
    },
});
