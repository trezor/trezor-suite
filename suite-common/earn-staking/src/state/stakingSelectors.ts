import {
    type StakingAmount,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    type StakingProductId,
    getStakingPositionAmountOutsideBalance,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber, isNotUndefined, typedObjectEntries } from '@trezor/utils';

import type { StakingProductsState } from './stakingProductsReducer';
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

const selectStakingPositions = (state: StakingRootState) => selectStakingState(state).positions;

const selectAccountPositions = (state: StakingRootState, accountKey: AccountKey) =>
    selectStakingPositions(state)[accountKey];

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

const isCountedStakingPosition =
    (products: StakingProductsState) =>
    ({ productId }: StakingPosition) =>
        products[productId]?.isCountedInAccountTotals === true;

const selectCountedStakingPositions = createWeakMapSelector(
    [selectStakingPositionsByAccount, selectStakingProducts],
    (positions, products) =>
        returnStableArrayIfEmpty(positions.filter(isCountedStakingPosition(products))),
);

const getStakingAmountOutsideBalance = (
    positions: readonly StakingPosition[],
    products: StakingProductsState,
): StakingAmount =>
    stakingAmountSchema.parse(
        positions
            .reduce((sum, position) => {
                const descriptor = products[position.productId];

                if (descriptor === undefined) return sum;
                if (position.amountOutsideBalance !== undefined) {
                    return sum.plus(position.amountOutsideBalance);
                }

                return descriptor.isCountedInAccountTotals
                    ? sum.plus(
                          getStakingPositionAmountOutsideBalance(position, descriptor.rewardsKind),
                      )
                    : sum;
            }, new BigNumber(0))
            .toFixed(0),
    );

export const selectStakingAccountAmountOutsideBalance = createWeakMapSelector(
    [selectStakingPositionsByAccount, selectStakingProducts],
    getStakingAmountOutsideBalance,
);

export const selectStakingAmountsOutsideBalance = createWeakMapSelector(
    [selectStakingPositions, selectStakingProducts],
    (positionsByAccount, products): Partial<Record<AccountKey, StakingAmount>> =>
        typedObjectEntries(positionsByAccount).reduce<Partial<Record<AccountKey, StakingAmount>>>(
            (amounts, [accountKey, accountPositions]) => {
                if (accountPositions !== undefined) {
                    amounts[accountKey] = getStakingAmountOutsideBalance(
                        Object.values(accountPositions).filter(isNotUndefined),
                        products,
                    );
                }

                return amounts;
            },
            {},
        ),
);

export const selectStakingAccountTotals = createWeakMapSelector(
    [selectCountedStakingPositions],
    (countedPositions): StakingPositionBalances => ({
        staked: sumBalance(countedPositions, 'staked'),
        pending: sumBalance(countedPositions, 'pending'),
        unstaking: sumBalance(countedPositions, 'unstaking'),
        withdrawable: sumBalance(countedPositions, 'withdrawable'),
        rewards: sumBalance(countedPositions, 'rewards'),
    }),
);
