import {
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionDetails,
    type StakingPositionWarningCode,
    type StakingProductDescriptor,
    getStakingPositionAmount,
    hasPendingStakingOperation,
    hasStakingPositionWarning,
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
import {
    getAccountBalanceWithStaking,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
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

// With today's catalog an account has at most one counted position.
export const selectStakingAccountPositionEntry = (
    state: StakingRootState,
    accountKey: AccountKey,
): StakingPositionEntry | null =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey)[0] ?? null;

export const selectIsStakingAccountWithoutPool = (
    state: StakingRootState,
    accountKey: AccountKey,
): boolean => {
    const position = selectStakingAccountPositionEntry(state, accountKey)?.position;

    return (
        position !== undefined &&
        hasStakingPositionWarning(position, 'no-stake-pool') &&
        !hasPendingStakingOperation(position, 'stake')
    );
};

export type StakingPositionDetailsOfKind<TKind extends StakingPositionDetails['kind']> = Extract<
    StakingPositionDetails,
    { kind: TKind }
>;

const isStakingPositionDetailsOfKind = <TKind extends StakingPositionDetails['kind']>(
    details: StakingPositionDetails,
    kind: TKind,
): details is StakingPositionDetailsOfKind<TKind> => details.kind === kind;

export const selectStakingAccountPositionDetails = <TKind extends StakingPositionDetails['kind']>(
    state: StakingRootState,
    accountKey: AccountKey,
    kind: TKind,
): StakingPositionDetailsOfKind<TKind> | null => {
    const details = selectStakingAccountPositionEntry(state, accountKey)?.position.details ?? null;

    return details !== null && isStakingPositionDetailsOfKind(details, kind) ? details : null;
};

export const selectIsStakingAccountActive = (
    state: StakingRootState,
    accountKey: AccountKey,
): boolean =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey).some(({ position }) =>
        isStakingPositionActive(position),
    );

// Without an operation, any pending staking transaction of the counted positions counts.
export const selectIsStakingOperationPending = (
    state: StakingRootState,
    accountKey: AccountKey,
    operation?: StakingOperation,
): boolean =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey).some(({ position }) =>
        hasPendingStakingOperation(position, operation),
    );

// Locked stake is held outside the account balance; liquid stake is the balance itself.
export const selectStakingAccountLockup = (
    state: StakingRootState,
    accountKey: AccountKey,
): StakingPosition['lockup'] | null =>
    selectStakingAccountPositionEntry(state, accountKey)?.position.lockup ?? null;

export const selectStakingAccountAmount = (
    state: StakingRootState,
    accountKey: AccountKey,
): StakingAmount =>
    stakingAmountSchema.parse(
        selectCountedStakingPositionEntriesByAccount(state, accountKey)
            .reduce(
                (sum, { position }) => sum.plus(getStakingPositionAmount(position)),
                new BigNumber(0),
            )
            .toFixed(0),
    );

export const selectHasStakingAccountWarning = (
    state: StakingRootState,
    accountKey: AccountKey,
    code: StakingPositionWarningCode,
): boolean =>
    selectCountedStakingPositionEntriesByAccount(state, accountKey).some(({ position }) =>
        hasStakingPositionWarning(position, code),
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

/** The account's coin balance with what is staked outside of it counted in. */
export const selectAccountCryptoBalanceWithStaking = createWeakMapSelector(
    [
        (state: StakingRootState & AccountsRootState, accountKey: AccountKey) =>
            selectAccountByKey(state, accountKey),
        selectStakingAccountAmountOutsideBalance,
    ],
    (account, stakingBalance): string =>
        account ? getAccountBalanceWithStaking({ account, stakingBalance }) : '0',
);
