/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClientDep, QueryClientProvider } from '@suite-common/react-query';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type UseNetworkStakingRateParams, useNetworkStakingRate } from './useNetworkStakingRate';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };
type HookState = StakingRootState & AccountsRootState;

const ada = asNetworkSymbol('ada');

const adaEverstake = mockStakingProductDescriptor({
    networkSymbol: ada,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
});
const adaFivebinaries = mockStakingProductDescriptor({
    networkSymbol: ada,
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    consentKey: null,
});

const fivebinariesAccount = mockWalletAccount({
    symbol: ada,
    descriptor: asAccountDescriptor('fivebinaries'),
});
const unstakedAccount = mockWalletAccount({
    symbol: ada,
    descriptor: asAccountDescriptor('unstaked'),
});
const accounts: Account[] = [fivebinariesAccount, unstakedAccount];

const renderNetworkStakingRate = (params: UseNetworkStakingRateParams) => {
    const queryClient = mockStakingQueryClient({
        productInfo: {
            [adaEverstake.id]: mockStakingProductInfo({ rate: 2.4 }),
            [adaFivebinaries.id]: mockStakingProductInfo({ rate: null, targets: [] }),
        },
    });
    const { services } = createTestCompositionRoot<HookDeps, HookState>({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({ accounts: (state: Account[] = []) => state }),
        },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    descriptors: [adaEverstake, adaFivebinaries],
                    positions: {
                        [fivebinariesAccount.key]: [
                            mockStakingPosition({
                                productId: adaFivebinaries.id,
                                lockup: 'liquid',
                                unlocks: [],
                                targets: [],
                                operations: ['unstake', 'claim', 'vote'],
                            }),
                        ],
                    },
                }),
            },
            wallet: { accounts },
        },
        services: () => ({ staking: mockStakingServices(), queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHookWithStoreProvider(() => useNetworkStakingRate(params), { services, wrapper });
};

describe('useNetworkStakingRate', () => {
    it('rates an account on the product of its position', () => {
        expect(
            renderNetworkStakingRate({ networkSymbol: ada, accountKey: fivebinariesAccount.key })
                .result.current,
        ).toEqual({ rate: null, rateKind: 'apy', isPending: false });
    });

    it('rates an account without a position on the product its network stakes on', () => {
        expect(
            renderNetworkStakingRate({ networkSymbol: ada, accountKey: unstakedAccount.key }).result
                .current,
        ).toEqual({ rate: 2.4, rateKind: 'apy', isPending: false });
    });

    it('rates a network on the product it stakes on', () => {
        expect(renderNetworkStakingRate({ networkSymbol: ada }).result.current).toEqual({
            rate: 2.4,
            rateKind: 'apy',
            isPending: false,
        });
    });

    it.each([
        { name: 'a network without a product', networkSymbol: asNetworkSymbol('btc') },
        { name: 'no network', networkSymbol: null },
    ])('rates nothing for $name', ({ networkSymbol }) => {
        expect(renderNetworkStakingRate({ networkSymbol }).result.current).toEqual({
            rate: null,
            rateKind: null,
            isPending: false,
        });
    });
});
