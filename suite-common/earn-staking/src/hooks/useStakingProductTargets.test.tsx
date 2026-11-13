/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import type { StakingProductInfo } from '@suite-common/earn-staking-common';
import {
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClientDep, QueryClientProvider } from '@suite-common/react-query';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useStakingProductTargets } from './useStakingProductTargets';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };

const ada = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('ada'), type: 'native' });

const renderStakingProductTargets = (productInfo: StakingProductInfo | null) => {
    const queryClient = mockStakingQueryClient({
        productInfo: productInfo === null ? {} : { [ada.id]: productInfo },
    });
    const { services } = createTestCompositionRoot<HookDeps, StakingRootState>({
        reducer: { earn: combineReducers({ staking: stakingReducer }) },
        preloadedState: { earn: { staking: mockStakingState({ descriptors: [ada] }) } },
        services: () => ({ staking: mockStakingServices(), queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHookWithStoreProvider(() => useStakingProductTargets(ada.id), {
        services,
        wrapper,
    });
};

describe('useStakingProductTargets', () => {
    it('lists the targets of the cached product info', () => {
        const productInfo = mockStakingProductInfo();

        expect(renderStakingProductTargets(productInfo).result.current).toBe(productInfo.targets);
    });

    it('shares one empty list before the product info arrives', () => {
        expect(renderStakingProductTargets(null).result.current).toBe(
            renderStakingProductTargets(mockStakingProductInfo({ targets: [] })).result.current,
        );
    });
});
