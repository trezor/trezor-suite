import {
    type StakingProductModule,
    getStakingProductId,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductModule,
} from '@suite-common/earn-staking-common/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingProductRepositoryDeps,
    createStakingProductRepository,
    injectStakingProductRepository,
} from './createStakingProductRepository';
import { mockStakingProductRepository } from '../../mocks';

const eth = asNetworkSymbol('eth');
const sol = asNetworkSymbol('sol');
const dsol = asNetworkSymbol('dsol');
const ada = asNetworkSymbol('ada');

const ethAdapter = mockStakingProductAdapter();
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ networkSymbol: sol, type: 'native' }),
});
const solExternalAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({
        networkSymbol: sol,
        providerId: stakingProviderIdSchema.parse('external'),
        type: 'native',
        operations: [],
        platforms: { desktop: { access: 'read-only' }, mobile: { access: 'read-only' } },
    }),
});
const dsolAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ networkSymbol: dsol, type: 'native' }),
});
const adaAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ networkSymbol: ada, type: 'native' }),
});

const createModules = () => ({
    ethModule: mockStakingProductModule({
        networkSymbols: [eth],
        load: mock<StakingProductModule['load']>(() => Promise.resolve([ethAdapter])),
    }),
    solanaModule: mockStakingProductModule({
        networkSymbols: [sol, dsol],
        load: mock<StakingProductModule['load']>(() =>
            Promise.resolve([solAdapter, solExternalAdapter, dsolAdapter]),
        ),
    }),
});

const createFailingModule = (message: string) =>
    mockStakingProductModule({
        networkSymbols: [ada],
        load: mock<StakingProductModule['load']>(() => Promise.reject(new Error(message))),
    });

const createDeps = (
    productModules: readonly StakingProductModule[],
): StakingProductRepositoryDeps => ({
    productModules,
    onProductsRegistered: mock<StakingProductRepositoryDeps['onProductsRegistered']>(() => {}),
});

const setup = (productModules?: readonly StakingProductModule[]) => {
    const modules = createModules();
    const deps = createDeps(productModules ?? [modules.ethModule, modules.solanaModule]);

    return { ...modules, deps, repository: createStakingProductRepository(deps) };
};

describe('createStakingProductRepository', () => {
    it('loads nothing until a network is requested', () => {
        const { repository, ethModule, solanaModule } = setup();

        expect(ethModule.load).not.toHaveBeenCalled();
        expect(solanaModule.load).not.toHaveBeenCalled();
        expect(repository.list()).toEqual([]);
        expect(repository.isSupportedSymbol(eth)).toBe(false);
    });

    it('loads only the modules serving the requested networks', async () => {
        const { repository, ethModule, solanaModule } = setup();

        await repository.ensureLoaded([dsol, ada]);

        expect(ethModule.load).not.toHaveBeenCalled();
        expect(solanaModule.load).toHaveBeenCalledTimes(1);
        expect(repository.list()).toEqual([solAdapter, solExternalAdapter, dsolAdapter]);
        expect(repository.isSupportedSymbol(sol)).toBe(true);
        expect(repository.isSupportedSymbol(eth)).toBe(false);
    });

    it('lists adapters in registration order', async () => {
        const { repository } = setup();

        await repository.ensureLoaded([sol]);
        await repository.ensureLoaded([eth]);

        expect(repository.list()).toEqual([
            solAdapter,
            solExternalAdapter,
            dsolAdapter,
            ethAdapter,
        ]);
    });

    it('keeps the list referentially stable when nothing new registers', async () => {
        const { repository } = setup();

        await repository.ensureLoaded([eth]);
        const list = repository.list();
        await repository.ensureLoaded([eth, ada]);

        expect(repository.list()).toBe(list);
    });

    it('returns a new list once another module registers', async () => {
        const { repository } = setup();

        await repository.ensureLoaded([eth]);
        const list = repository.list();
        await repository.ensureLoaded([sol]);

        expect(repository.list()).not.toBe(list);
        expect(repository.list()).toEqual([
            ethAdapter,
            solAdapter,
            solExternalAdapter,
            dsolAdapter,
        ]);
    });

    it('loads a module once for concurrent requests', async () => {
        const { repository, ethModule, solanaModule } = setup();

        await Promise.all([
            repository.ensureLoaded([sol]),
            repository.ensureLoaded([dsol]),
            repository.ensureLoaded([sol, eth]),
        ]);

        expect(solanaModule.load).toHaveBeenCalledTimes(1);
        expect(ethModule.load).toHaveBeenCalledTimes(1);
    });

    it('does not load a registered module again', async () => {
        const { repository, ethModule } = setup();

        await repository.ensureLoaded([eth]);
        await repository.ensureLoaded([eth]);

        expect(ethModule.load).toHaveBeenCalledTimes(1);
    });

    it('reports the registered adapters of a module as they register', async () => {
        const { repository, deps } = setup();
        jest.mocked(deps.onProductsRegistered).mockImplementation(adapters => {
            expect(repository.isSupportedSymbol(adapters[0]!.descriptor.networkSymbol)).toBe(true);
        });

        await repository.ensureLoaded([eth, sol]);

        expect(deps.onProductsRegistered).toHaveBeenCalledTimes(2);
        expect(deps.onProductsRegistered).toHaveBeenCalledWith([ethAdapter]);
        expect(deps.onProductsRegistered).toHaveBeenCalledWith([
            solAdapter,
            solExternalAdapter,
            dsolAdapter,
        ]);
    });

    it('rejects a failed load, registers nothing from it and retries it next time', async () => {
        const { ethModule } = createModules();
        const failingModule = createFailingModule('Loading chunk staking-cardano failed');
        const { repository, deps } = setup([ethModule, failingModule]);

        await expect(repository.ensureLoaded([eth, ada])).rejects.toThrow(
            'Staking product modules failed to load: ada: Loading chunk staking-cardano failed',
        );

        expect(repository.list()).toEqual([ethAdapter]);
        expect(deps.onProductsRegistered).toHaveBeenCalledTimes(1);

        jest.mocked(failingModule.load).mockImplementation(() => Promise.resolve([adaAdapter]));
        await repository.ensureLoaded([ada]);

        expect(failingModule.load).toHaveBeenCalledTimes(2);
        expect(repository.isSupportedSymbol(ada)).toBe(true);
    });

    it('lists every module that failed to load in one error', async () => {
        const failingSolanaModule = mockStakingProductModule({
            networkSymbols: [sol, dsol],
            load: mock<StakingProductModule['load']>(() =>
                Promise.reject(new Error('Loading chunk staking-solana failed')),
            ),
        });
        const { repository } = setup([
            failingSolanaModule,
            createFailingModule('Loading chunk staking-cardano failed'),
        ]);

        await expect(repository.ensureLoaded([sol, ada])).rejects.toThrow(
            'Staking product modules failed to load: sol, dsol: Loading chunk staking-solana failed; ada: Loading chunk staking-cardano failed',
        );

        expect(repository.list()).toEqual([]);
    });

    it('rejects a load that throws instead of returning a promise', async () => {
        const { ethModule } = createModules();
        const throwingModule = mockStakingProductModule({
            networkSymbols: [ada],
            load: mock<StakingProductModule['load']>(() => {
                throw new Error('No loader');
            }),
        });
        const { repository } = setup([ethModule, throwingModule]);

        await expect(repository.ensureLoaded([ada, eth])).rejects.toThrow(
            'Staking product modules failed to load: ada: No loader',
        );

        expect(repository.isSupportedSymbol(eth)).toBe(true);
    });

    it('gets an adapter by product id', async () => {
        const { repository } = setup();

        await repository.ensureLoaded([sol]);

        expect(repository.get(solExternalAdapter.descriptor.id)).toBe(solExternalAdapter);
    });

    it('throws for a product id that is not registered', () => {
        const { repository } = setup();
        const productId = getStakingProductId({
            networkSymbol: ada,
            asset: { kind: 'native' },
            providerId: stakingProviderIdSchema.parse('everstake'),
            type: 'native',
        });

        expect(() => repository.get(productId)).toThrow('ada:ada:everstake:native');
    });

    it('lists adapters by symbol', async () => {
        const { repository } = setup();

        await repository.ensureLoaded([eth, sol]);

        expect(repository.listBySymbol(sol)).toEqual([solAdapter, solExternalAdapter]);
        expect(repository.listBySymbol(eth)).toEqual([ethAdapter]);
        expect(repository.listBySymbol(ada)).toEqual([]);
    });

    it('keeps the empty symbol result referentially stable', () => {
        const { repository } = setup();

        expect(repository.listBySymbol(ada)).toBe(repository.listBySymbol(asNetworkSymbol('btc')));
    });

    it('works without any module', async () => {
        const { repository } = setup([]);

        await repository.ensureLoaded([eth]);

        expect(repository.list()).toEqual([]);
        expect(repository.isSupportedSymbol(eth)).toBe(false);
    });

    describe('registration', () => {
        const expectNothingRegistered = async (
            productModules: readonly StakingProductModule[],
            message: string | RegExp,
        ) => {
            const { repository, deps } = setup(productModules);

            await expect(repository.ensureLoaded([eth, sol, ada])).rejects.toThrow(message);

            expect(repository.list()).toEqual([]);
            expect(deps.onProductsRegistered).not.toHaveBeenCalled();
        };

        it('rejects a product registered twice by one module', async () => {
            await expectNothingRegistered(
                [
                    mockStakingProductModule({
                        load: mock<StakingProductModule['load']>(() =>
                            Promise.resolve([ethAdapter, ethAdapter]),
                        ),
                    }),
                ],
                'eth:everstake:pooled is registered twice',
            );
        });

        it('rejects a product registered by two modules', async () => {
            const { ethModule } = createModules();
            const { repository, deps } = setup([
                ethModule,
                mockStakingProductModule({
                    networkSymbols: [eth],
                    load: mock<StakingProductModule['load']>(() => Promise.resolve([ethAdapter])),
                }),
            ]);

            await expect(repository.ensureLoaded([eth])).rejects.toThrow(
                'eth:everstake:pooled is registered twice',
            );

            expect(repository.list()).toEqual([ethAdapter]);
            expect(deps.onProductsRegistered).toHaveBeenCalledTimes(1);
        });

        it('rejects a product served by a module declared for other networks', async () => {
            await expectNothingRegistered(
                [
                    mockStakingProductModule({
                        networkSymbols: [sol],
                        load: mock<StakingProductModule['load']>(() =>
                            Promise.resolve([solAdapter, ethAdapter]),
                        ),
                    }),
                ],
                'eth:eth:everstake:pooled is served by a module declared for sol',
            );
        });

        it('rejects a module that registers no product for a declared network', async () => {
            await expectNothingRegistered(
                [
                    mockStakingProductModule({
                        networkSymbols: [sol, dsol],
                        load: mock<StakingProductModule['load']>(() =>
                            Promise.resolve([solAdapter]),
                        ),
                    }),
                ],
                'module for sol, dsol registered no product for dsol',
            );
        });

        it('rejects an adapter with an invalid descriptor', async () => {
            const descriptor = mockStakingProductDescriptor();
            const adapter = mockStakingProductAdapter({
                descriptor: {
                    ...descriptor,
                    limits: { ...descriptor.limits, minStakeAmount: '1.5' as never },
                },
            });

            await expectNothingRegistered(
                [
                    mockStakingProductModule({
                        load: mock<StakingProductModule['load']>(() => Promise.resolve([adapter])),
                    }),
                ],
                /eth:everstake:pooled has an invalid descriptor[\s\S]*limits\.minStakeAmount/,
            );
        });

        it('rejects an adapter whose id disagrees with its descriptor', async () => {
            const adapter = mockStakingProductAdapter({
                descriptor: mockStakingProductDescriptor({ id: solAdapter.descriptor.id }),
            });

            await expectNothingRegistered(
                [
                    mockStakingProductModule({
                        load: mock<StakingProductModule['load']>(() => Promise.resolve([adapter])),
                    }),
                ],
                /sol:everstake:native has an invalid descriptor/,
            );
        });
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
