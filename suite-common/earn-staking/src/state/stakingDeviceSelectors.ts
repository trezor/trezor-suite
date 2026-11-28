import type { DeviceRootState } from '@suite-common/device';
import {
    type StakingPositionWarningCode,
    getStakingPositionAmount,
    hasStakingPositionWarning,
    hasUnvaluedLiquidStakingBalance,
    isStakingPositionActive,
} from '@suite-common/earn-staking-common';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { isPositiveBalance, sortByCoin } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type StakingPositionEntry,
    selectStakingPositionEntriesByAccount,
} from './stakingAccountSelectors';
import type { StakingRootState } from './stakingReducer';
import { selectStakingPlatform } from './stakingSelectors';

export type StakingDeviceRootState = StakingRootState &
    AccountsRootState &
    DeviceRootState &
    NetworksRootState;

const createStableAccounts = weakMapMemoize((...accounts: Account[]) => accounts);

const createStableEntries = weakMapMemoize((...entries: StakingPositionEntry[]) => entries);

const createStableSymbols = weakMapMemoize((...symbols: NetworkSymbol[]) => symbols);

const selectState = (state: StakingDeviceRootState) => state;

const selectNetworkSymbolParam = (_state: StakingDeviceRootState, networkSymbol: NetworkSymbol) =>
    networkSymbol;

// Every device selector below reads the selected device state, so one wallet: a passphrase wallet
// is a device instance of its own, as for selectDeviceAccounts in wallet-core.
const selectDeviceAccountsInNetworkOrder = createWeakMapSelector(
    [selectVisibleDeviceAccounts, selectSupportedNetworkSymbols],
    (accounts, supportedNetworkSymbols): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(...sortByCoin(accounts, supportedNetworkSymbols)),
        ),
);

const selectDeviceAllStakingPositionEntries = createWeakMapSelector(
    [selectState, selectDeviceAccountsInNetworkOrder],
    (state, accounts): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...accounts.flatMap(account =>
                    selectStakingPositionEntriesByAccount(state, account.key),
                ),
            ),
        ),
);

const selectDeviceCountedStakingPositionEntries = createWeakMapSelector(
    [selectDeviceAllStakingPositionEntries],
    (entries): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ descriptor }) => descriptor.isCountedInAccountTotals),
            ),
        ),
);

// Earn also shows liquid token positions that the current platform can manage.
export const selectDeviceEarnStakingPositionEntries = createWeakMapSelector(
    [selectDeviceAllStakingPositionEntries, selectStakingPlatform],
    (entries, platform): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(
                    ({ descriptor, position }) =>
                        (descriptor.isCountedInAccountTotals ||
                            (platform !== null &&
                                descriptor.platforms[platform].access === 'manage' &&
                                position.details?.kind === 'liquid-token')) &&
                        (isPositiveBalance(getStakingPositionAmount(position)) ||
                            hasUnvaluedLiquidStakingBalance(position)),
                ),
            ),
        ),
);

export const selectDeviceEarnStakingPositionsCount = (state: StakingDeviceRootState): number =>
    selectDeviceEarnStakingPositionEntries(state).length;

// An active position can also be a registered stake key with an empty balance.
export const selectDeviceStakingPositionEntries = createWeakMapSelector(
    [selectDeviceCountedStakingPositionEntries],
    (entries): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ position }) =>
                    new BigNumber(getStakingPositionAmount(position)).gt(0),
                ),
            ),
        ),
);

export const selectDeviceActiveStakingPositionEntries = createWeakMapSelector(
    [selectDeviceCountedStakingPositionEntries],
    (entries): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ position }) => isStakingPositionActive(position)),
            ),
        ),
);

export const selectDeviceActiveStakingPositionEntriesBySymbol = createWeakMapSelector(
    [selectDeviceActiveStakingPositionEntries, selectNetworkSymbolParam],
    (entries, networkSymbol): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ descriptor }) => descriptor.networkSymbol === networkSymbol),
            ),
        ),
);

export const selectDeviceStakingPositionEntriesBySymbol = createWeakMapSelector(
    [selectDeviceStakingPositionEntries, selectNetworkSymbolParam],
    (entries, networkSymbol): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(({ descriptor }) => descriptor.networkSymbol === networkSymbol),
            ),
        ),
);

export const selectDeviceStakingSymbols = createWeakMapSelector(
    [selectDeviceStakingPositionEntries],
    (entries): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            createStableSymbols(
                ...new Set(entries.map(({ descriptor }) => descriptor.networkSymbol)),
            ),
        ),
);

export const selectDeviceStakingPositionsCount = (state: StakingDeviceRootState): number =>
    selectDeviceStakingPositionEntries(state).length;

const selectWarningCodeParam = (
    _state: StakingDeviceRootState,
    code: StakingPositionWarningCode,
): StakingPositionWarningCode => code;

// The funded entries with the warning whose account holds a spendable balance: a banner that
// shows a warning asks for a transaction, which a position that holds rewards alone cannot pay
// for, so the legacy desktop banner wanted an available balance.
export const selectDeviceStakingEntriesByWarning = createWeakMapSelector(
    [selectState, selectDeviceStakingPositionEntries, selectWarningCodeParam],
    (state, entries, code): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...entries.filter(
                    ({ accountKey, position }) =>
                        hasStakingPositionWarning(position, code) &&
                        isPositiveBalance(
                            selectAccountByKey(state, accountKey)?.availableBalance ?? '0',
                        ),
                ),
            ),
        ),
);

export const selectDeviceStakingEntryByWarning = (
    state: StakingDeviceRootState,
    code: StakingPositionWarningCode,
): StakingPositionEntry | null => selectDeviceStakingEntriesByWarning(state, code)[0] ?? null;
