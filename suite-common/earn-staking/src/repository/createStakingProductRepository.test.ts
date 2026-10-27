import {
    asStakingAmount,
    asStakingProviderId,
    getStakingProductId,
} from '@suite-common/earn-staking-common';
import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductRepositoryDeps,
    createStakingProductRepository,
    injectStakingProductRepository,
} from './createStakingProductRepository';
import { mockStakingProductRepository } from '../../mocks';

const ethAdapter = mockStakingProductAdapter();
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ symbol: asNetworkSymbol('sol'), type: 'native' }),
});
const solExternalAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({
        symbol: asNetworkSymbol('sol'),
        providerId: asStakingProviderId('external'),
        type: 'native',
        operations: [],
        platforms: { desktop: { access: 'read-only' }, mobile: { access: 'read-only' } },
    }),
});

const deps: StakingProductRepositoryDeps = {
    adapters: [ethAdapter, solAdapter, solExternalAdapter],
};

describe('createStakingProductRepository', () => {
    it('lists adapters in registration order', () => {
        const repository = createStakingProductRepository(deps);

        expect(repository.list()).toEqual([ethAdapter, solAdapter, solExternalAdapter]);
    });

    it('gets an adapter by product id', () => {
        const repository = createStakingProductRepository(deps);

        expect(repository.get(solExternalAdapter.descriptor.id)).toBe(solExternalAdapter);
    });

    it('throws for a product id that is not registered', () => {
        const repository = createStakingProductRepository(deps);
        const productId = getStakingProductId({
            symbol: asNetworkSymbol('ada'),
            providerId: asStakingProviderId('everstake'),
            type: 'native',
        });

        expect(() => repository.get(productId)).toThrow('ada:everstake:native');
    });

    it('lists adapters by symbol', () => {
        const repository = createStakingProductRepository(deps);

        expect(repository.listBySymbol(asNetworkSymbol('sol'))).toEqual([
            solAdapter,
            solExternalAdapter,
        ]);
        expect(repository.listBySymbol(asNetworkSymbol('eth'))).toEqual([ethAdapter]);
        expect(repository.listBySymbol(asNetworkSymbol('ada'))).toEqual([]);
    });

    it('keeps the empty symbol result referentially stable', () => {
        const repository = createStakingProductRepository(deps);

        expect(repository.listBySymbol(asNetworkSymbol('ada'))).toBe(
            repository.listBySymbol(asNetworkSymbol('btc')),
        );
    });

    it('reports which symbols have a product', () => {
        const repository = createStakingProductRepository(deps);

        expect(repository.isSupportedSymbol(asNetworkSymbol('eth'))).toBe(true);
        expect(repository.isSupportedSymbol(asNetworkSymbol('sol'))).toBe(true);
        expect(repository.isSupportedSymbol(asNetworkSymbol('ada'))).toBe(false);
    });

    it('works without any adapter', () => {
        const repository = createStakingProductRepository({ adapters: [] });

        expect(repository.list()).toEqual([]);
        expect(repository.isSupportedSymbol(asNetworkSymbol('eth'))).toBe(false);
    });

    it('rejects a product registered twice', () => {
        expect(() =>
            createStakingProductRepository({ adapters: [ethAdapter, ethAdapter] }),
        ).toThrow('eth:everstake:pooled is registered twice');
    });

    it('rejects an adapter with an invalid descriptor', () => {
        const descriptor = mockStakingProductDescriptor();
        const adapter = mockStakingProductAdapter({
            descriptor: {
                ...descriptor,
                limits: { ...descriptor.limits, minStakeAmount: asStakingAmount('1.5') },
            },
        });

        expect(() => createStakingProductRepository({ adapters: [adapter] })).toThrow(
            /eth:everstake:pooled has an invalid descriptor[\s\S]*limits\.minStakeAmount/,
        );
    });

    it('rejects an adapter whose id disagrees with its descriptor', () => {
        const adapter = mockStakingProductAdapter({
            descriptor: mockStakingProductDescriptor({ id: solAdapter.descriptor.id }),
        });

        expect(() => createStakingProductRepository({ adapters: [adapter] })).toThrow(
            /sol:everstake:native has an invalid descriptor/,
        );
    });
});

describe('injectStakingProductRepository', () => {
    it('selects the repository from the staking services', () => {
        const stakingProductRepository = mockStakingProductRepository();

        expect(injectStakingProductRepository({ staking: { stakingProductRepository } })).toEqual({
            stakingProductRepository,
        });
    });
});
