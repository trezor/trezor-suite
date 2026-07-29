import type { Account, ReceiveInfo } from '@suite-common/wallet-types';

import type { SignAddress } from './types';

const withCategory = (
    addresses: { address: string; path: string }[],
    category: SignAddress['category'],
): SignAddress[] => addresses.map(address => ({ ...address, category }));

export const getAccountAddressesForSigning = (
    account: Account,
    touchedAddresses: ReceiveInfo[],
): SignAddress[] => [
    ...withCategory(
        touchedAddresses.length ? touchedAddresses : (account.addresses?.unused ?? []).slice(0, 1),
        'TR_ADDRESSES_FRESH',
    ),
    ...withCategory(account.addresses?.used?.slice().reverse() ?? [], 'TR_ADDRESSES_USED'),
    ...withCategory(account.addresses?.change?.slice().reverse() ?? [], 'TR_ADDRESSES_CHANGE'),
];
