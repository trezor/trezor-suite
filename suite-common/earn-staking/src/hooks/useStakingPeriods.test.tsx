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

import { useStakingPeriods } from './useStakingPeriods';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };

const eth = mockStakingProductDescriptor();

const renderStakingPeriods = (productInfo: StakingProductInfo | null) => {
    const queryClient = mockStakingQueryClient({
        productInfo: productInfo === null ? {} : { [eth.id]: productInfo },
    });
    const { services } = createTestCompositionRoot<HookDeps, StakingRootState>({
        reducer: { earn: combineReducers({ staking: stakingReducer }) },
        preloadedState: { earn: { staking: mockStakingState({ descriptors: [eth] }) } },
        services: () => ({ staking: mockStakingServices(), queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHookWithStoreProvider(() => useStakingPeriods(eth.id), { services, wrapper });
};

describe('useStakingPeriods', () => {
    it('reads the periods of the cached product info', () => {
        const productInfo = mockStakingProductInfo({
            entryPeriodDays: 4,
            exitPeriodDays: 3,
            rewardPeriodDays: null,
            nextRewardAt: 1_777_000_000_000,
        });

        expect(renderStakingPeriods(productInfo).result.current).toEqual({
            entryPeriodDays: 4,
            exitPeriodDays: 3,
            rewardPeriodDays: null,
            nextRewardAt: 1_777_000_000_000,
        });
    });

    it('knows no period before the product info arrives', () => {
        expect(renderStakingPeriods(null).result.current).toEqual({
            entryPeriodDays: null,
            exitPeriodDays: null,
            rewardPeriodDays: null,
            nextRewardAt: null,
        });
    });
});
