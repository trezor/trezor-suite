import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    selectSuiteSyncAccountAddressesByAccount,
} from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type ReceiveInfo } from '@suite-common/wallet-types';
import { parseStaticSessionId } from '@trezor/device-utils';

export type ReceiveAddressRootState = AccountsRootState & TransactionsRootState & ReceiveRootState;
export type ReceiveAddressListRootState = ReceiveAddressRootState & SuiteSyncDataRootState;

const createReceiveAddressSelector = createWeakMapSelector.withTypes<ReceiveAddressRootState>();
const createReceiveAddressListSelector =
    createWeakMapSelector.withTypes<ReceiveAddressListRootState>();
const EMPTY_ADDRESS_LABELS: Record<string, string | null> = {};
const EMPTY_RECEIVE_INFOS: ReceiveInfo[] = [];

type AccountAddress = NonNullable<Account['addresses']>['used'][number];
type ReceiveAccountAddressByPathSelector = (
    state: ReceiveAddressRootState,
    accountKey: AccountKey,
    addressPath: string,
) => AccountAddress | undefined;

export const selectReceiveAccount = (
    state: ReceiveAddressRootState,
    accountKey: AccountKey,
): Account | null => selectAccountByKey(state, accountKey);

export const selectReceiveAccountTouchedAddresses = (
    state: ReceiveAddressRootState,
    accountKey: AccountKey,
): ReceiveInfo[] => selectTouchedAddresses(state, accountKey);

export const selectReceiveAccountPendingAddresses = (
    state: ReceiveAddressRootState,
    accountKey: AccountKey,
): string[] => selectPendingAccountAddresses(state, accountKey);

export const selectIsReceiveAccountUtxoBased = (
    state: ReceiveAddressRootState,
    accountKey: AccountKey,
): boolean => selectIsAccountUtxoBased(state, accountKey);

const selectReceiveAddressPath = (
    _state: ReceiveAddressRootState,
    _accountKey: AccountKey,
    addressPath: string,
): string => addressPath;

export const selectReceiveAccountAddressByPath: ReceiveAccountAddressByPathSelector =
    createReceiveAddressSelector(
        [selectReceiveAccount, selectReceiveAddressPath],
        (account, addressPath): AccountAddress | undefined => {
            const usedAddress = account?.addresses?.used.find(
                address => address.path === addressPath,
            );

            if (usedAddress) {
                return usedAddress;
            }

            const unusedAddress = account?.addresses?.unused.find(
                address => address.path === addressPath,
            );

            if (unusedAddress) {
                return unusedAddress;
            }

            return undefined;
        },
    );

export const selectReceiveAccountSuiteSyncAddresses = (
    state: ReceiveAddressListRootState,
    accountKey: AccountKey,
) => {
    const account = selectReceiveAccount(state, accountKey);

    if (!account) {
        return null;
    }

    return selectSuiteSyncAccountAddressesByAccount(
        state,
        parseStaticSessionId(account.deviceState).walletDescriptor,
        account.descriptor,
        account.symbol,
    );
};

export const selectReceiveAccountSuiteSyncAddressLabels = createReceiveAddressListSelector(
    [selectReceiveAccountSuiteSyncAddresses],
    (accountAddresses): Record<string, string | null> => {
        if (!accountAddresses) {
            return EMPTY_ADDRESS_LABELS;
        }

        return accountAddresses.reduce<Record<string, string | null>>(
            (labels, { address, label }) => {
                labels[address] = label ?? null;

                return labels;
            },
            {},
        );
    },
);

export const selectReceiveAccountLabeledUnusedAddresses = createReceiveAddressListSelector(
    [selectReceiveAccount, selectReceiveAccountSuiteSyncAddressLabels],
    (account, addressLabels): ReceiveInfo[] =>
        account?.addresses?.unused.reduce<ReceiveInfo[]>((labeledAddresses, { path, address }) => {
            if (!addressLabels[address]) {
                return labeledAddresses;
            }

            return labeledAddresses.concat({ path, address });
        }, []) ?? EMPTY_RECEIVE_INFOS,
);
