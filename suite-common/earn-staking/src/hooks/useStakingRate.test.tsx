/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import {
    type StakingPosition,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClientDep, QueryClientProvider } from '@suite-common/react-query';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type UseStakingRateParams, useStakingRate } from './useStakingRate';
import { mockStakingQueryClient, mockStakingServices, mockStakingState } from '../../mocks';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingReducer } from '../state/stakingReducer';

type HookDeps = { services: StakingDep & QueryClientDep };

const trx = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('trx'),
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
});
const accountKey = mockAccountKey({ symbol: asNetworkSymbol('trx') });
const unstakedAccountKey = mockAccountKey({
    descriptor: 'unstaked',
    symbol: asNetworkSymbol('trx'),
});

const luganodes = {
    address: 'TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9',
    providerId: stakingProviderIdSchema.parse('luganodes'),
};
const p2p = {
    address: 'TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij',
    providerId: stakingProviderIdSchema.parse('p2p.org'),
};

const trxInfo = mockStakingProductInfo({
    rate: 3.3,
    targets: [
        { ...luganodes, name: 'Luganodes', rate: 3.2, saturation: null },
        { ...p2p, name: 'P2P.org', rate: 3.6, saturation: null },
    ],
});

const votedSplit = mockStakingPosition({
    productId: trx.id,
    targets: [
        { ...luganodes, amount: stakingAmountSchema.parse('500000000') },
        { ...p2p, amount: stakingAmountSchema.parse('1500000000') },
    ],
});

type RenderParams = UseStakingRateParams & {
    positions?: readonly StakingPosition[];
    isInfoCached?: boolean;
};

const renderStakingRate = ({
    positions = [votedSplit],
    isInfoCached = true,
    ...params
}: RenderParams) => {
    const queryClient = mockStakingQueryClient({
        productInfo: isInfoCached ? { [trx.id]: trxInfo } : {},
    });
    const { services } = createTestCompositionRoot<HookDeps, StakingRootState>({
        reducer: { earn: combineReducers({ staking: stakingReducer }) },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    descriptors: [trx],
                    positions: { [accountKey]: positions },
                }),
            },
        },
        services: () => ({ staking: mockStakingServices(), queryClient }),
    });
    const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHookWithStoreProvider(() => useStakingRate(params), { services, wrapper });
};

describe('useStakingRate', () => {
    it('is the product rate without an account', () => {
        expect(renderStakingRate({ productId: trx.id }).result.current).toEqual({
            rate: 3.3,
            rateKind: 'apr',
            isPending: false,
        });
    });

    it('weighs the rates of the position targets for an account with a position', () => {
        expect(renderStakingRate({ productId: trx.id, accountKey }).result.current).toEqual({
            rate: 3.5,
            rateKind: 'apr',
            isPending: false,
        });
    });

    it('is the product rate for an account without a position', () => {
        expect(
            renderStakingRate({ productId: trx.id, accountKey: unstakedAccountKey }).result.current,
        ).toEqual({ rate: 3.3, rateKind: 'apr', isPending: false });
    });

    it('is pending and unknown before the product info arrives', () => {
        expect(
            renderStakingRate({ productId: trx.id, accountKey, isInfoCached: false }).result
                .current,
        ).toEqual({ rate: null, rateKind: 'apr', isPending: true });
    });

    it('has no rate kind for a product that is not registered', () => {
        const unknown = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('ada') });

        expect(renderStakingRate({ productId: unknown.id }).result.current).toEqual({
            rate: null,
            rateKind: null,
            isPending: true,
        });
    });
});
