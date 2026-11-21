/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import type { QueryClientDep } from '@suite-common/react-query';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { transactionsInitialState } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { mock } from '@trezor/dependency-injection';

import { useRefreshStakingProductInfo } from './useRefreshStakingProductInfo';
import {
    mockStakingProductRepository,
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { getCachedStakingProductInfo } from '../state/stakingProductInfoQuery';
import { stakingReducer } from '../state/stakingReducer';
import type { RefreshStakingProductInfoThunkState } from '../state/stakingThunks';

type HookDeps = { services: StakingDep & QueryClientDep };

const eth = mockStakingProductDescriptor();
const ethInfo = mockStakingProductInfo({ rate: 4.2 });

const renderRefresh = () => {
    const queryClient = mockStakingQueryClient();
    const fetchProductInfo = mock<StakingProductAdapter['fetchProductInfo']>(() =>
        Promise.resolve(ethInfo),
    );
    const adapter = mockStakingProductAdapter({ descriptor: eth, fetchProductInfo });
    const root = createTestCompositionRoot<HookDeps, RefreshStakingProductInfoThunkState>({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({
                accounts: (state: Account[] = []) => state,
                transactions: (state = transactionsInitialState) => state,
            }),
        },
        preloadedState: {
            earn: { staking: mockStakingState({ descriptors: [eth] }) },
            wallet: { accounts: [], transactions: transactionsInitialState },
        },
        services: () => ({
            staking: mockStakingServices({
                stakingProductRepository: mockStakingProductRepository({ get: () => adapter }),
            }),
            queryClient,
        }),
    });
    const rendered = renderHookWithStoreProvider(() => useRefreshStakingProductInfo(), {
        services: root.services,
    });

    return { ...rendered, queryClient, fetchProductInfo };
};

describe('useRefreshStakingProductInfo', () => {
    it('asks for the product info of the registered products on mount', async () => {
        const { queryClient, fetchProductInfo } = renderRefresh();

        await waitFor(() => {
            expect(getCachedStakingProductInfo(queryClient, eth.id)).toEqual(ethInfo);
        });
        expect(fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('asks again only when forced within the maximum age', async () => {
        const { result, queryClient, fetchProductInfo } = renderRefresh();

        await waitFor(() => {
            expect(getCachedStakingProductInfo(queryClient, eth.id)).toEqual(ethInfo);
        });

        act(() => {
            result.current();
        });
        await act(async () => {
            await Promise.resolve();
        });
        expect(fetchProductInfo).toHaveBeenCalledTimes(1);

        act(() => {
            result.current({ force: true });
        });
        await waitFor(() => {
            expect(fetchProductInfo).toHaveBeenCalledTimes(2);
        });
    });
});
