import {
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    type StakingProductId,
    asStakingAmount,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import type { StakingProductEntry } from './stakingProductsReducer';
import type { StakingRootState } from './stakingReducer';

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const selectStakingPlatform = (state: StakingRootState) => state.staking.platform;

const selectStakingProducts = (state: StakingRootState) => state.staking.products;

const selectSymbolParam = (_state: StakingRootState, symbol: NetworkSymbol) => symbol;

export const selectStakingProductDescriptors = createWeakMapSelector(
    [selectStakingProducts],
    (products): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(
            Object.values(products)
                .filter(isDefined)
                .map(entry => entry.descriptor),
        ),
);

export const selectStakingProductDescriptorsBySymbol = createWeakMapSelector(
    [selectStakingProductDescriptors, selectSymbolParam],
    (descriptors, symbol): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(descriptors.filter(descriptor => descriptor.symbol === symbol)),
);

export const selectStakingProductEntry = (
    state: StakingRootState,
    productId: StakingProductId,
): StakingProductEntry | null => state.staking.products[productId] ?? null;

export const selectStakingProductDescriptor = (
    state: StakingRootState,
    productId: StakingProductId,
): StakingProductDescriptor | null => state.staking.products[productId]?.descriptor ?? null;

export const selectStakingProductInfo = (state: StakingRootState, productId: StakingProductId) =>
    state.staking.products[productId]?.info ?? null;

export const selectIsStakingSupportedSymbol = (state: StakingRootState, symbol: NetworkSymbol) =>
    selectStakingProductDescriptorsBySymbol(state, symbol).length > 0;

const selectAccountPositions = (state: StakingRootState, accountKey: AccountKey) =>
    state.staking.positions[accountKey];

export const selectStakingPositionsByAccount = createWeakMapSelector(
    [selectAccountPositions],
    (positions): readonly StakingPosition[] =>
        returnStableArrayIfEmpty(
            positions === undefined ? undefined : Object.values(positions).filter(isDefined),
        ),
);

export const selectStakingPosition = (
    state: StakingRootState,
    accountKey: AccountKey,
    productId: StakingProductId,
): StakingPosition | null => state.staking.positions[accountKey]?.[productId] ?? null;

const sumBalance = (
    positions: readonly StakingPosition[],
    balance: keyof StakingPositionBalances,
) =>
    asStakingAmount(
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
