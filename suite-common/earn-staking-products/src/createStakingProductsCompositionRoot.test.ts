import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';

import { createStakingProductsCompositionRoot } from './createStakingProductsCompositionRoot';

describe('createStakingProductsCompositionRoot', () => {
    const adapters = createStakingProductsCompositionRoot();

    it('registers the Everstake pooled product for mainnet and Hoodi', () => {
        expect(adapters.map(adapter => adapter.descriptor.id)).toEqual([
            'eth:eth:everstake:pooled',
            'thod:thod:everstake:pooled',
        ]);
    });

    it('registers descriptors that match the contract', () => {
        adapters.forEach(adapter => {
            expect(stakingProductDescriptorSchema.safeParse(adapter.descriptor).success).toBe(true);
        });
    });
});
