import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createStakingCompositionRoot } from './createStakingCompositionRoot';
import { stakingActions } from './state/stakingReducer';

const ethAdapter = mockStakingProductAdapter();
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ symbol: asNetworkSymbol('sol'), type: 'native' }),
});

const createDispatch = () => {
    const actions: UnknownAction[] = [];
    const dispatch: Dispatch = <T extends UnknownAction>(action: T): T => {
        actions.push(action);

        return action;
    };

    return { actions, dispatch };
};

describe('createStakingCompositionRoot', () => {
    it('registers the adapters in the repository', () => {
        const staking = createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [ethAdapter, solAdapter],
            dispatch: createDispatch().dispatch,
        });

        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter, solAdapter]);
    });

    it('loads the platform and the descriptors into the store', () => {
        const { actions, dispatch } = createDispatch();
        const staking = createStakingCompositionRoot({
            platform: 'mobile',
            adapters: [ethAdapter, solAdapter],
            dispatch,
        });

        staking.loadStakingProducts();

        expect(actions).toEqual([
            stakingActions.productsRegistered({
                platform: 'mobile',
                descriptors: [ethAdapter.descriptor, solAdapter.descriptor],
            }),
        ]);
    });

    it('loads no descriptors without adapters', () => {
        const { actions, dispatch } = createDispatch();

        createStakingCompositionRoot({
            platform: 'desktop',
            adapters: [],
            dispatch,
        }).loadStakingProducts();

        expect(actions).toEqual([
            stakingActions.productsRegistered({ platform: 'desktop', descriptors: [] }),
        ]);
    });
});
