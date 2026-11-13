import {
    type StakingAmount,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingProductDescriptor,
    type StakingProductId,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber, isNotNull, isNotUndefined, typedObjectEntries } from '@trezor/utils';

import type { StakingAccountPositions } from './stakingPositionsReducer';
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

const selectCountedStakingPositions = createWeakMapSelector(
    [selectStakingPositionsByAccount, selectStakingProducts],
    (positions, products) =>
        returnStableArrayIfEmpty(
            positions.filter(
                ({ productId }) => products[productId]?.isCountedInAccountTotals === true,
            ),
        ),
);

// The stake of liquid positions is already in the account balance; only locked positions hold
// funds outside it. Rewards are never added: they compound into the stake, are only expected, or
// are part of the balance.
export const selectStakingAccountAmountOutsideBalance = createWeakMapSelector(
    [selectCountedStakingPositions],
    (countedPositions): StakingAmount => {
        const lockedPositions = countedPositions.filter(({ lockup }) => lockup === 'locked');

        return stakingAmountSchema.parse(
            (['staked', 'pending', 'unstaking', 'withdrawable'] as const)
                .reduce(
                    (sum, balance) => sum.plus(sumBalance(lockedPositions, balance)),
                    new BigNumber(0),
                )
                .toFixed(0),
        );
    },
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

const getRevalidationTimes = (positions: StakingAccountPositions): number[] =>
    Object.values(positions)
        .map(position => position?.revalidateAt ?? null)
        .filter(isNotNull);

export const selectEarliestStakingRevalidateAt = createWeakMapSelector(
    [selectStakingPositions],
    (positions): number | null => {
        const revalidationTimes = Object.values(positions).flatMap(accountPositions =>
            accountPositions === undefined ? [] : getRevalidationTimes(accountPositions),
        );

        if (revalidationTimes.length === 0) {
            return null;
        }

        return Math.min(...revalidationTimes);
    },
);

export const selectStakingAccountKeysToRevalidate = (
    state: StakingRootState,
    now: number,
): AccountKey[] =>
    typedObjectEntries(selectStakingPositions(state)).flatMap(([accountKey, accountPositions]) =>
        accountPositions !== undefined &&
        getRevalidationTimes(accountPositions).some(revalidateAt => revalidateAt <= now)
            ? [accountKey]
            : [],
    );
