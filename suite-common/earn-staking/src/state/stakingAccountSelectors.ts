import {
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingProductDescriptor,
    hasPendingStakingOperation,
    isStakingPositionActive,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRateByKey,
} from '@suite-common/wallet-core';
import type { AccountKey, BaseCurrencyAmount } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import type { StakingRootState } from './stakingReducer';
import {
    selectStakingAccountAmountOutsideBalance,
    selectStakingPositionsByAccount,
    selectStakingProductDescriptors,
} from './stakingSelectors';
import { formatStakingAmount } from '../utils/formatStakingAmount';

export type StakingPositionEntry = {
    accountKey: AccountKey;
    position: StakingPosition;
    descriptor: StakingProductDescriptor;
};

export type StakingAccountFiatRootState = StakingRootState &
    AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

const createStakingPositionEntry = weakMapMemoize(
    (
        accountKey: AccountKey,
        position: StakingPosition,
        descriptor: StakingProductDescriptor,
    ): StakingPositionEntry => ({ accountKey, position, descriptor }),
);

const createStableEntries = weakMapMemoize((...entries: StakingPositionEntry[]) => entries);

const selectAccountKeyParam = (_state: StakingRootState, accountKey: AccountKey) => accountKey;

export const selectStakingPositionEntriesByAccount = createWeakMapSelector(
    [selectStakingProductDescriptors, selectStakingPositionsByAccount, selectAccountKeyParam],
    (descriptors, positions, accountKey): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...descriptors.flatMap(descriptor => {
                    const position = positions.find(
                        candidate => candidate.productId === descriptor.id,
                    );

                    if (position === undefined) return [];

                    const positionEntry = createStakingPositionEntry(
                        accountKey,
                        position,
                        descriptor,
                    );

                    return [positionEntry];
                }),
            ),
        ),
);

export const selectCountedStakingPositionEntriesByAccount = createWeakMapSelector(
    [selectStakingPositionEntriesByAccount],
    (entries): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ descriptor }) => descriptor.isCountedInAccountTotals),
            ),
        ),
);

export const selectIsStakingAccountActive = (
    state: StakingRootState,
    accountKey: AccountKey,
): boolean =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey).some(({ position }) =>
        isStakingPositionActive(position),
    );

export const selectIsStakingOperationPending = (
    state: StakingRootState,
    accountKey: AccountKey,
    operation: StakingOperation,
): boolean =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey).some(({ position }) =>
        hasPendingStakingOperation(position, operation),
    );

const selectAccountAvailableBalanceParam = (state: AccountsRootState, accountKey: AccountKey) =>
    selectAccountByKey(state, accountKey)?.availableBalance ?? null;

export const selectStakingAccountBalanceWithStaking = createWeakMapSelector(
    [selectAccountAvailableBalanceParam, selectStakingAccountAmountOutsideBalance],
    (availableBalance, amountOutsideBalance): StakingAmount => {
        if (availableBalance === null) {
            return ZERO_STAKING_AMOUNT;
        }

        const balanceWithStaking = new BigNumber(availableBalance).plus(amountOutsideBalance);

        return balanceWithStaking.isFinite()
            ? stakingAmountSchema.parse(balanceWithStaking.toFixed(0))
            : amountOutsideBalance;
    },
);

const selectAccountSymbolParam = (
    state: AccountsRootState,
    accountKey: AccountKey,
): NetworkSymbol | null => selectAccountByKey(state, accountKey)?.symbol ?? null;

const selectStakingAccountFiatRate = (
    state: AccountsRootState & FiatRatesRootState & WalletSettingsRootState,
    accountKey: AccountKey,
): number | null => {
    const symbol = selectAccountSymbolParam(state, accountKey);

    if (symbol === null) return null;

    const baseCurrency = selectBaseCurrency(state);

    const fiatRateKey = getFiatRateKey(symbol, baseCurrency);
    const currentFiatRate = selectCurrentFiatRateByKey(state, fiatRateKey);

    return currentFiatRate?.rate ?? null;
};

export const selectStakingAccountFiatAmount = createWeakMapSelector(
    [
        selectAccountSymbolParam,
        selectStakingAccountFiatRate,
        selectStakingAccountAmountOutsideBalance,
    ],
    (symbol, rate, amountOutsideBalance): BaseCurrencyAmount | null => {
        if (symbol === null || rate === null) {
            return null;
        }

        const amount = formatStakingAmount({ amount: amountOutsideBalance, networkSymbol: symbol });

        return toFiatCurrency({ amount, rate });
    },
);
