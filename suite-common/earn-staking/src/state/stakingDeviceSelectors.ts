import type { DeviceRootState } from '@suite-common/device';
import {
    type StakingPositionWarningCode,
    getStakingPositionAmount,
} from '@suite-common/earn-staking-common';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type AccountsRootState, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { sortByCoin } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type StakingPositionEntry,
    selectCountedStakingPositionEntriesByAccount,
} from './stakingAccountSelectors';
import type { StakingRootState } from './stakingReducer';

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

const selectDeviceAccountsInCoinOrder = createWeakMapSelector(
    [selectVisibleDeviceAccounts, selectSupportedNetworkSymbols],
    (accounts, supportedNetworkSymbols): readonly Account[] =>
        returnStableArrayIfEmpty(
            createStableAccounts(...sortByCoin(accounts, supportedNetworkSymbols)),
        ),
);

const selectDeviceCountedStakingPositionEntries = createWeakMapSelector(
    [selectState, selectDeviceAccountsInCoinOrder],
    (state, accounts): readonly StakingPositionEntry[] =>
        returnStableArrayIfEmpty(
            createStableEntries(
                ...accounts.flatMap(account =>
                    selectCountedStakingPositionEntriesByAccount(state, account.key),
                ),
            ),
        ),
);

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

export const selectDeviceStakingEntryByWarning = (
    state: StakingDeviceRootState,
    code: StakingPositionWarningCode,
): StakingPositionEntry | null =>
    selectDeviceCountedStakingPositionEntries(state).find(({ position }) =>
        position.warnings.some(warning => warning.code === code),
    ) ?? null;
