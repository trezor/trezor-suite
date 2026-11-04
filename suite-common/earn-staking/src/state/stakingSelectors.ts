import {
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    type StakingProductId,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber, isNotUndefined } from '@trezor/utils';

import type { StakingRootState } from './stakingReducer';

const selectStakingState = (state: StakingRootState) => state.earn.staking;

export const selectStakingPlatform = (state: StakingRootState) =>
    selectStakingState(state).platform;

const selectStakingProducts = (state: StakingRootState) => selectStakingState(state).products;

const selectNetworkSymbolParam = (_state: StakingRootState, networkSymbol: NetworkSymbol) =>
    networkSymbol;

export const selectStakingProductDescriptors = createWeakMapSelector(
    [selectStakingProducts],
    (products): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(Object.values(products).filter(isNotUndefined)),
);

export const selectStakingProductDescriptorsBySymbol = createWeakMapSelector(
    [selectStakingProductDescriptors, selectNetworkSymbolParam],
    (descriptors, networkSymbol): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(
            descriptors.filter(descriptor => descriptor.networkSymbol === networkSymbol),
        ),
);

export const selectStakingProductDescriptor = (
    state: StakingRootState,
    productId: StakingProductId,
): StakingProductDescriptor | null => selectStakingState(state).products[productId] ?? null;

export const selectIsStakingSupportedSymbol = (
    state: StakingRootState,
    networkSymbol: NetworkSymbol,
) => selectStakingProductDescriptorsBySymbol(state, networkSymbol).length > 0;

const selectAccountPositions = (state: StakingRootState, accountKey: AccountKey) =>
    selectStakingState(state).positions[accountKey];

export const selectStakingPositionsByAccount = createWeakMapSelector(
    [selectAccountPositions],
    (positions): readonly StakingPosition[] =>
        returnStableArrayIfEmpty(
            positions === undefined ? undefined : Object.values(positions).filter(isNotUndefined),
        ),
);

export const selectStakingPosition = (
    state: StakingRootState,
    accountKey: AccountKey,
    productId: StakingProductId,
): StakingPosition | null => selectStakingState(state).positions[accountKey]?.[productId] ?? null;

const sumBalance = (
    positions: readonly StakingPosition[],
    balance: keyof StakingPositionBalances,
) =>
    stakingAmountSchema.parse(
        positions
            .reduce((sum, position) => sum.plus(position.balances[balance]), new BigNumber(0))
            .toFixed(0),
    );

export const selectStakingAccountTotals = createWeakMapSelector(
    [selectStakingPositionsByAccount],
    (positions): StakingPositionBalances => ({
        staked: sumBalance(positions, 'staked'),
        pending: sumBalance(positions, 'pending'),
        unstaking: sumBalance(positions, 'unstaking'),
        withdrawable: sumBalance(positions, 'withdrawable'),
        rewards: sumBalance(positions, 'rewards'),
    }),
);
