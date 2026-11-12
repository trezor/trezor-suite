import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';
import type { Dispatch } from '@trezor/redux-utils';

import { createStakingCompositionRoot } from './createStakingCompositionRoot';
import {
    STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS,
    type StakingSchedulerTimers,
} from './createStakingScheduler';
import { mockStakingDeviceAccess } from '../mocks';
import { stakingActions } from './state/stakingReducer';

const deviceAccess = mockStakingDeviceAccess();
const ethAdapter = mockStakingProductAdapter();
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({
        networkSymbol: asNetworkSymbol('sol'),
        type: 'native',
    }),
});

const createDispatch = () => {
    const actions: unknown[] = [];
    const dispatch: Dispatch = (action: unknown) => {
        actions.push(action);

        return action;
    };

    return { actions, dispatch };
};

const createTimers = () => {
    const scheduled: { callback: () => void; delayMs: number }[] = [];
    const timers: StakingSchedulerTimers = {
        schedule: (callback, delayMs) => {
            scheduled.push({ callback, delayMs });

            return () => {};
        },
    };

    return { scheduled, timers };
};

describe('createStakingCompositionRoot', () => {
    it('registers the adapters in the repository', () => {
        const staking = createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [ethAdapter, solAdapter],
            deviceAccess,
            dispatch: createDispatch().dispatch,
        });

        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter, solAdapter]);
    });

    it('exposes the device access it was given', () => {
        const staking = createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [ethAdapter],
            deviceAccess,
            dispatch: createDispatch().dispatch,
        });

        expect(staking.deviceAccess).toBe(deviceAccess);
    });

    it('starts the scheduler, then loads the platform and the descriptors into the store', () => {
        const { actions, dispatch } = createDispatch();
        const { scheduled, timers } = createTimers();
        const staking = createStakingCompositionRoot({
            platform: 'mobile',
            adapters: [ethAdapter, solAdapter],
            deviceAccess,
            dispatch,
            timers,
        });

        staking.loadStakingProducts();

        expect(scheduled.map(({ delayMs }) => delayMs)).toEqual([
            STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS,
        ]);
        expect(actions).toEqual([
            stakingActions.productsRegistered({
                platform: 'mobile',
                descriptors: [ethAdapter.descriptor, solAdapter.descriptor],
            }),
        ]);
    });

    it('dispatches the product info refresh on every tick', () => {
        const { actions, dispatch } = createDispatch();
        const { scheduled, timers } = createTimers();

        createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [ethAdapter],
            deviceAccess,
            dispatch,
            timers,
        }).loadStakingProducts();
        scheduled[0]?.callback();

        expect(actions).toHaveLength(2);
        expect(typeof actions[1]).toBe('function');
        expect(scheduled).toHaveLength(2);
    });

    it('loads no descriptors and starts nothing without adapters', () => {
        const { actions, dispatch } = createDispatch();
        const { scheduled, timers } = createTimers();

        createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [],
            deviceAccess,
            dispatch,
            timers,
        }).loadStakingProducts();

        expect(scheduled).toEqual([]);
        expect(actions).toEqual([
            stakingActions.productsRegistered({ platform: 'desktop', descriptors: [] }),
        ]);
    });
});
