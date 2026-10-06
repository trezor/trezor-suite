import { getReceiveAddressHistoryList } from '@suite-common/address';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { getAddressPathIndex } from '@trezor/crypto-utils';

export type ReceiveAddressItem = {
    path: string;
    address: string;
    pathIndex?: number;
    received?: string;
    label?: string;
    isFresh: boolean;
};

type BuildReceiveAddressItemsParams = {
    account: Account;
    touchedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
    addressLabels: Record<string, string | null>;
    currentFreshAddress?: { path: string };
};

export const buildReceiveAddressItems = ({
    account,
    touchedAddresses,
    pendingAddresses,
    addressLabels,
    currentFreshAddress,
}: BuildReceiveAddressItemsParams): ReceiveAddressItem[] =>
    getReceiveAddressHistoryList({
        account,
        touchedAddresses,
        pendingAddresses,
        addressLabels,
        currentFreshAddress,
        includeCurrentFreshAddress: false,
    }).map(address => ({
        path: address.path,
        address: address.address,
        pathIndex: getAddressPathIndex(address.path),
        received: address.transfers
            ? formatNetworkAmount(address.received || '0', account.symbol)
            : undefined,
        label: addressLabels[address.address] ?? undefined,
        isFresh: !address.transfers,
    }));
