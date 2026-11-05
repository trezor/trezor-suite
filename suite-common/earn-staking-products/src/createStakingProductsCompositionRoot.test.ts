import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';

import { createStakingProductsCompositionRoot } from './createStakingProductsCompositionRoot';

describe('createStakingProductsCompositionRoot', () => {
    const adapters = createStakingProductsCompositionRoot();

    it('registers the Ethereum and Solana products for mainnet and the test networks', () => {
        expect(adapters.map(adapter => adapter.descriptor.id)).toEqual([
            'eth:eth:everstake:pooled',
            'thod:thod:everstake:pooled',
            'sol:sol:everstake:native',
            'sol:sol:external:native',
            'dsol:dsol:everstake:native',
            'dsol:dsol:external:native',
        ]);
    });

    it('registers descriptors that match the contract', () => {
        adapters.forEach(adapter => {
            expect(stakingProductDescriptorSchema.safeParse(adapter.descriptor).success).toBe(true);
        });
    });
});
