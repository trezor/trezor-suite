/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import {
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClientDep, QueryClientProvider } from '@suite-common/react-query';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { useNetworkStakingPeriods } from './useNetworkStakingPeriods';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };

const eth = mockStakingProductDescriptor();

const NO_PERIODS = {
    entryPeriodDays: null,
    exitPeriodDays: null,
    rewardPeriodDays: null,
    nextRewardAt: null,
};

const renderNetworkStakingPeriods = (networkSymbol: NetworkSymbol | null) => {
    const queryClient = mockStakingQueryClient({
        productInfo: {
            [eth.id]: mockStakingProductInfo({ entryPeriodDays: 4, exitPeriodDays: 3 }),
        },
    });
    const { services } = createTestCompositionRoot<HookDeps, StakingRootState>({
        reducer: { earn: combineReducers({ staking: stakingReducer }) },
        preloadedState: { earn: { staking: mockStakingState({ descriptors: [eth] }) } },
        services: () => ({ staking: mockStakingServices(), queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHookWithStoreProvider(() => useNetworkStakingPeriods(networkSymbol), {
        services,
        wrapper,
    });
};

describe('useNetworkStakingPeriods', () => {
    it('reads the periods of the product the network stakes on', () => {
        expect(renderNetworkStakingPeriods(asNetworkSymbol('eth')).result.current).toEqual({
            entryPeriodDays: 4,
            exitPeriodDays: 3,
            rewardPeriodDays: null,
            nextRewardAt: 1_777_000_000_000,
        });
    });

    it.each([
        { name: 'a network without a product', networkSymbol: asNetworkSymbol('btc') },
        { name: 'no network', networkSymbol: null },
    ])('knows no period for $name', ({ networkSymbol }) => {
        expect(renderNetworkStakingPeriods(networkSymbol).result.current).toEqual(NO_PERIODS);
    });
});
