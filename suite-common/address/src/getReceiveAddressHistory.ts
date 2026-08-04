import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { type AccountAddress } from '@trezor/connect';
import { comparePath } from '@trezor/crypto-utils';

import { getFirstFreshAddress, getFreshAddresses } from './getFirstFreshAddress';

type CurrentFreshAddress = {
    path: string;
    address: string;
};

type CurrentFreshAddressInHistory = {
    path: string;
};

type GetReceiveAddressParams = {
    account: Account;
    touchedAddresses: ReceiveInfo[];
    labeledUnusedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
    isAccountUtxoBased: boolean;
};

type GetReceiveAddressToAddParams = GetReceiveAddressParams & {
    currentFreshAddress?: CurrentFreshAddress;
};

type GetReceiveAddressHistoryListParams = {
    account: Account;
    touchedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
    addressLabels: Record<string, string | null>;
    currentFreshAddress?: CurrentFreshAddressInHistory;
    includeCurrentFreshAddress?: boolean;
};

const sortReceiveAddressesByHighestPath = (addresses: AccountAddress[]): AccountAddress[] =>
    addresses.sort(
        (firstAddress, secondAddress) => comparePath(firstAddress.path, secondAddress.path) * -1,
    );

const getPendingUnusedAddresses = (account: Account, pendingAddresses: string[]): ReceiveInfo[] =>
    account.addresses?.unused.reduce<ReceiveInfo[]>((result, { path, address }) => {
        if (!pendingAddresses.includes(address)) {
            return result;
        }

        return result.concat({ path, address });
    }, []) ?? [];

const getTransferredUnusedAddresses = (account: Account): ReceiveInfo[] =>
    account.addresses?.unused.reduce<ReceiveInfo[]>((result, { path, address, transfers }) => {
        if (!transfers) {
            return result;
        }

        return result.concat({ path, address });
    }, []) ?? [];

const getUsedReceiveAddresses = (account: Account): ReceiveInfo[] =>
    account.addresses?.used.map(({ path, address }) => ({ path, address })) ?? [];

export const getReceiveAddressForFlowEntry = ({
    account,
    touchedAddresses,
    labeledUnusedAddresses,
    pendingAddresses,
    isAccountUtxoBased,
}: GetReceiveAddressParams): AccountAddress | undefined => {
    const durableUsedAddresses = labeledUnusedAddresses
        .concat(getPendingUnusedAddresses(account, pendingAddresses))
        .concat(getTransferredUnusedAddresses(account))
        .concat(getUsedReceiveAddresses(account));
    const alreadyUsedAddresses = touchedAddresses.concat(durableUsedAddresses);
    const freshAddress = getFirstFreshAddress(
        account,
        alreadyUsedAddresses,
        pendingAddresses,
        isAccountUtxoBased,
    );

    if (freshAddress) {
        return freshAddress;
    }

    if (!isAccountUtxoBased) {
        return undefined;
    }

    const onChainUsedAddresses = getPendingUnusedAddresses(account, pendingAddresses).concat(
        getTransferredUnusedAddresses(account),
        getUsedReceiveAddresses(account),
    );

    const loadedAddressesNotBlockedByDurableState = getFreshAddresses(
        account,
        onChainUsedAddresses,
        pendingAddresses,
        isAccountUtxoBased,
    );

    return sortReceiveAddressesByHighestPath(loadedAddressesNotBlockedByDurableState)[0];
};

export const getReceiveAddressToAdd = ({
    account,
    touchedAddresses,
    labeledUnusedAddresses,
    pendingAddresses,
    currentFreshAddress,
    isAccountUtxoBased,
}: GetReceiveAddressToAddParams): AccountAddress | undefined => {
    const alreadyReservedAddresses = touchedAddresses
        .concat(labeledUnusedAddresses)
        .concat(getPendingUnusedAddresses(account, pendingAddresses))
        .concat(getTransferredUnusedAddresses(account))
        .concat(currentFreshAddress ? [currentFreshAddress] : []);

    return getFirstFreshAddress(
        account,
        alreadyReservedAddresses,
        pendingAddresses,
        isAccountUtxoBased,
    );
};

export const getReceiveAddressHistoryList = ({
    account,
    touchedAddresses,
    pendingAddresses,
    addressLabels,
    currentFreshAddress,
    includeCurrentFreshAddress = true,
}: GetReceiveAddressHistoryListParams): AccountAddress[] => {
    const used = account.addresses?.used ?? [];
    const unused = account.addresses?.unused ?? [];

    const isCurrentFreshAddress = (address: AccountAddress) =>
        currentFreshAddress?.path === address.path;

    const isUnusedAddressDurablyVisible = (address: AccountAddress) =>
        touchedAddresses.some(touchedAddress => touchedAddress.path === address.path) ||
        pendingAddresses.includes(address.address) ||
        !!addressLabels[address.address] ||
        !!address.transfers;

    const durableVisibleAddresses = used.concat(unused.filter(isUnusedAddressDurablyVisible));

    const visibleUnusedAddresses = unused.reduce<AccountAddress[]>((result, address) => {
        const isLowerThanDurableAddress = durableVisibleAddresses.some(
            durableVisibleAddress => comparePath(address.path, durableVisibleAddress.path) < 0,
        );
        const isVisible =
            isUnusedAddressDurablyVisible(address) ||
            isLowerThanDurableAddress ||
            (includeCurrentFreshAddress && isCurrentFreshAddress(address));
        const isExcludedCurrentFreshAddress =
            !includeCurrentFreshAddress && isCurrentFreshAddress(address);

        return isVisible && !isExcludedCurrentFreshAddress ? result.concat(address) : result;
    }, []);

    return sortReceiveAddressesByHighestPath(used.concat(visibleUnusedAddresses));
};
