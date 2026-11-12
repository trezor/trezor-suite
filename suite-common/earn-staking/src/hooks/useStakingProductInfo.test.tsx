/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import {
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import {
    type QueryClientDep,
    QueryClientProvider,
    commonQueryKeys,
} from '@suite-common/react-query';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useStakingProductInfo } from './useStakingProductInfo';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };

const eth = mockStakingProductDescriptor();
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const ethInfo = mockStakingProductInfo({ rate: 3.08 });

const renderStakingProductInfo = (
    productId: StakingProductId,
    productInfo: Partial<Record<StakingProductId, StakingProductInfo>>,
) => {
    const queryClient = mockStakingQueryClient({ productInfo });
    const services = mockStakingServices();
    const root = createTestCompositionRoot<HookDeps, StakingRootState>({
        reducer: { earn: combineReducers({ staking: stakingReducer }) },
        preloadedState: { earn: { staking: mockStakingState({ descriptors: [eth, sol] }) } },
        services: () => ({ staking: services, queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const rendered = renderHookWithStoreProvider(() => useStakingProductInfo(productId), {
        services: root.services,
        wrapper,
    });

    return { ...rendered, queryClient, services };
};

describe('useStakingProductInfo', () => {
    it('reads the cached product info', () => {
        const { result } = renderStakingProductInfo(eth.id, { [eth.id]: ethInfo });

        expect(result.current).toEqual({ productInfo: ethInfo, isPending: false });
    });

    it('is pending without cached info and never fetches', () => {
        const { result, queryClient, services } = renderStakingProductInfo(sol.id, {
            [eth.id]: ethInfo,
        });

        expect(result.current).toEqual({ productInfo: null, isPending: true });
        expect(queryClient.getQueryState(commonQueryKeys.stakingProductInfo(sol.id))).toMatchObject(
            {
                status: 'pending',
                fetchStatus: 'idle',
            },
        );
        expect(services.stakingProductRepository.get).not.toHaveBeenCalled();
    });

    it('follows the cache when the refresh writes new info', async () => {
        const { result, queryClient } = renderStakingProductInfo(eth.id, { [eth.id]: ethInfo });
        const refreshed = mockStakingProductInfo({ rate: 3.2 });

        act(() => {
            queryClient.setQueryData(commonQueryKeys.stakingProductInfo(eth.id), refreshed);
        });

        await waitFor(() => {
            expect(result.current).toEqual({ productInfo: refreshed, isPending: false });
        });
    });
});
