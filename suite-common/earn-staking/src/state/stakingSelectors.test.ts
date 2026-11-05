import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { StakingRootState } from './stakingReducer';
import {
    selectIsStakingSupportedSymbol,
    selectStakingAccountAmountOutsideBalance,
    selectStakingAccountTotals,
    selectStakingPlatform,
    selectStakingPosition,
    selectStakingPositionsByAccount,
    selectStakingProductDescriptor,
    selectStakingProductDescriptors,
    selectStakingProductDescriptorsBySymbol,
} from './stakingSelectors';
import { mockStakingState } from '../../mocks';

const eth = mockStakingProductDescriptor();
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const accountKey = mockAccountKey({ symbol: asNetworkSymbol('eth') });
const unknownAccountKey = mockAccountKey({ descriptor: 'unknown', symbol: asNetworkSymbol('eth') });
const ethPosition = mockStakingPosition();
const solPosition = mockStakingPosition({
    productId: sol.id,
    balances: {
        ...mockStakingPosition().balances,
        staked: '1000000000000000000' as never,
        rewards: '0' as never,
    },
});

const state: StakingRootState = {
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [eth, sol],
            positions: { [accountKey]: [ethPosition, solPosition] },
        }),
    },
};

const empty: StakingRootState = { earn: { staking: mockStakingState({ descriptors: [] }) } };

describe('staking selectors', () => {
    it('selects the platform', () => {
        expect(selectStakingPlatform(state)).toBe('mobile');
        expect(selectStakingPlatform(empty)).toBe('desktop');
    });

    it('lists descriptors in registration order with a stable empty result', () => {
        expect(selectStakingProductDescriptors(state)).toEqual([eth, sol]);
        expect(selectStakingProductDescriptors(state)).toBe(selectStakingProductDescriptors(state));
        expect(selectStakingProductDescriptors(empty)).toBe(
            selectStakingProductDescriptorsBySymbol(state, asNetworkSymbol('ada')),
        );
    });

    it('lists descriptors by symbol', () => {
        expect(selectStakingProductDescriptorsBySymbol(state, asNetworkSymbol('sol'))).toEqual([
            sol,
        ]);
        expect(selectStakingProductDescriptorsBySymbol(state, asNetworkSymbol('sol'))).toBe(
            selectStakingProductDescriptorsBySymbol(state, asNetworkSymbol('sol')),
        );
    });

    it('reports supported symbols from the registered products', () => {
        expect(selectIsStakingSupportedSymbol(state, asNetworkSymbol('eth'))).toBe(true);
        expect(selectIsStakingSupportedSymbol(state, asNetworkSymbol('ada'))).toBe(false);
    });

    it('selects a descriptor by product id', () => {
        expect(selectStakingProductDescriptor(state, eth.id)).toEqual(eth);
        expect(
            selectStakingProductDescriptor(
                state,
                mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('ada') }).id,
            ),
        ).toBeNull();
    });

    it('lists an account positions with a stable reference', () => {
        expect(selectStakingPositionsByAccount(state, accountKey)).toEqual([
            ethPosition,
            solPosition,
        ]);
        expect(selectStakingPositionsByAccount(state, accountKey)).toBe(
            selectStakingPositionsByAccount(state, accountKey),
        );
        expect(selectStakingPositionsByAccount(state, unknownAccountKey)).toBe(
            selectStakingPositionsByAccount(empty, accountKey),
        );
    });

    it('selects a single position', () => {
        expect(selectStakingPosition(state, accountKey, sol.id)).toEqual(solPosition);
        expect(selectStakingPosition(state, unknownAccountKey, sol.id)).toBeNull();
    });

    it('sums only the positions of products counted in account totals', () => {
        const external = mockStakingProductDescriptor({
            networkSymbol: asNetworkSymbol('sol'),
            providerId: stakingProviderIdSchema.parse('external'),
            type: 'native',
            operations: [],
            consentKey: null,
            isCountedInAccountTotals: false,
        });
        const unregistered = mockStakingProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            type: 'native',
        });
        const stateWithUncountedPositions: StakingRootState = {
            earn: {
                staking: mockStakingState({
                    descriptors: [eth, sol, external],
                    positions: {
                        [accountKey]: [
                            ethPosition,
                            solPosition,
                            mockStakingPosition({ productId: external.id }),
                            mockStakingPosition({ productId: unregistered.id }),
                        ],
                    },
                }),
            },
        };

        expect(selectStakingAccountTotals(stateWithUncountedPositions, accountKey)).toEqual(
            selectStakingAccountTotals(state, accountKey),
        );
        expect(selectStakingAccountTotals(stateWithUncountedPositions, accountKey)).toBe(
            selectStakingAccountTotals(stateWithUncountedPositions, accountKey),
        );
    });

    it('counts only locked positions as held outside the account balance', () => {
        const ada = mockStakingProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            type: 'native',
        });
        const stateWithLiquidPosition: StakingRootState = {
            earn: {
                staking: mockStakingState({
                    descriptors: [eth, ada],
                    positions: {
                        [accountKey]: [
                            ethPosition,
                            mockStakingPosition({
                                productId: ada.id,
                                lockup: 'liquid',
                                balances: {
                                    ...mockStakingPosition().balances,
                                    staked: '994750000' as never,
                                    unstaking: '0' as never,
                                    rewards: '5250000' as never,
                                },
                            }),
                        ],
                    },
                }),
            },
        };

        expect(selectStakingAccountTotals(stateWithLiquidPosition, accountKey).staked).toBe(
            '2000000000994750000',
        );
        expect(selectStakingAccountAmountOutsideBalance(stateWithLiquidPosition, accountKey)).toBe(
            '2500000000000000000',
        );
        expect(selectStakingAccountAmountOutsideBalance(state, unknownAccountKey)).toBe('0');
    });

    it('sums balances across an account products', () => {
        expect(selectStakingAccountTotals(state, accountKey)).toEqual({
            staked: '3000000000000000000',
            pending: '0',
            unstaking: '1000000000000000000',
            withdrawable: '0',
            rewards: '12000000000000000',
        });
        expect(selectStakingAccountTotals(state, unknownAccountKey)).toEqual({
            staked: '0',
            pending: '0',
            unstaking: '0',
            withdrawable: '0',
            rewards: '0',
        });
    });
});
