import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import type { StakingProductModule } from '@suite-common/earn-staking-common';
import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductModule,
} from '@suite-common/earn-staking-common/mocks';
import { asGetter, mock } from '@trezor/dependency-injection';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingCompositionRootDeps,
    createStakingCompositionRoot,
} from './createStakingCompositionRoot';
import { mockStakingDeviceAccess } from '../mocks';
import { stakingActions } from './state/stakingReducer';

const eth = asNetworkSymbol('eth');
const sol = asNetworkSymbol('sol');

const deviceAccess = mockStakingDeviceAccess();
const ethAdapter = mockStakingProductAdapter();
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ networkSymbol: sol, type: 'native' }),
});

const createDispatch = () => {
    const actions: UnknownAction[] = [];
    const dispatch: Dispatch = <T extends UnknownAction>(action: T): T => {
        actions.push(action);

        return action;
    };

    return { actions, dispatch };
};

const createModules = () => ({
    ethModule: mockStakingProductModule({
        networkSymbols: [eth],
        load: mock<StakingProductModule['load']>(() => Promise.resolve([ethAdapter])),
    }),
    solModule: mockStakingProductModule({
        networkSymbols: [sol],
        load: mock<StakingProductModule['load']>(() => Promise.resolve([solAdapter])),
    }),
});

const createDeps = (
    overrides: Partial<StakingCompositionRootDeps> = {},
): StakingCompositionRootDeps & ReturnType<typeof createDispatch> => {
    const { actions, dispatch } = createDispatch();
    const { ethModule, solModule } = createModules();

    return {
        platform: 'desktop',
        productModules: [ethModule, solModule],
        deviceAccess,
        dispatch,
        getEnabledNetworks: asGetter((): readonly NetworkSymbol[] => [eth, sol]),
        actions,
        ...overrides,
    };
};

describe('createStakingCompositionRoot', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('registers nothing before the products are loaded', () => {
        const deps = createDeps();
        const staking = createStakingCompositionRoot(deps);

        expect(staking.stakingProductRepository.list()).toEqual([]);
        expect(deps.actions).toEqual([]);
    });

    it('exposes the device access it was given', () => {
        const staking = createStakingCompositionRoot(createDeps());

        expect(staking.deviceAccess).toBe(deviceAccess);
    });

    it('loads the modules of the enabled networks and registers each with the platform', async () => {
        const deps = createDeps({
            platform: 'mobile',
            getEnabledNetworks: asGetter((): readonly NetworkSymbol[] => [sol]),
        });
        const staking = createStakingCompositionRoot(deps);

        await staking.loadStakingProducts();

        expect(staking.stakingProductRepository.list()).toEqual([solAdapter]);
        expect(deps.actions).toEqual([
            stakingActions.productsRegistered({
                platform: 'mobile',
                descriptors: [solAdapter.descriptor],
            }),
        ]);
    });

    it('registers every module of the enabled networks once', async () => {
        const deps = createDeps();
        const staking = createStakingCompositionRoot(deps);

        await staking.loadStakingProducts();
        await staking.loadStakingProducts();

        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter, solAdapter]);
        expect(deps.actions).toEqual([
            stakingActions.productsRegistered({
                platform: 'desktop',
                descriptors: [ethAdapter.descriptor],
            }),
            stakingActions.productsRegistered({
                platform: 'desktop',
                descriptors: [solAdapter.descriptor],
            }),
        ]);
    });

    it('registers nothing without an enabled network', async () => {
        const deps = createDeps({
            getEnabledNetworks: asGetter((): readonly NetworkSymbol[] => []),
        });
        const staking = createStakingCompositionRoot(deps);

        await staking.loadStakingProducts();

        expect(staking.stakingProductRepository.list()).toEqual([]);
        expect(deps.actions).toEqual([]);
    });

    it('warns about a module that failed to load, keeps the others and retries it', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { ethModule, solModule } = createModules();
        jest.mocked(solModule.load).mockImplementationOnce(() =>
            Promise.reject(new Error('Loading chunk staking-solana failed')),
        );
        const deps = createDeps({ productModules: [ethModule, solModule] });
        const staking = createStakingCompositionRoot(deps);

        await staking.loadStakingProducts();

        expect(warn).toHaveBeenCalledWith(
            'Staking product modules failed to load: sol: Loading chunk staking-solana failed',
        );
        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter]);

        await staking.loadStakingProducts();

        expect(solModule.load).toHaveBeenCalledTimes(2);
        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter, solAdapter]);
        expect(deps.actions).toHaveLength(2);
    });
});
