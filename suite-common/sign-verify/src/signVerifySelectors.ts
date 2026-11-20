import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { type Account } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type SignAddressCategory = 'fresh' | 'used' | 'change' | 'stake';

export type SignAddress = {
    address: string;
    path: string;
};

export type SignAddressGroup = {
    /** Missing for a network's single account address, as on Ethereum. */
    category?: SignAddressCategory;
    addresses: SignAddress[];
};

export type SignAddressesRootState = ReceiveRootState;

const toSignAddress = ({ address, path }: SignAddress): SignAddress => ({ address, path });

export const selectAccountSignAddresses = createWeakMapSelector.withTypes<SignAddressesRootState>()(
    [
        (_state, account: Account) => account.addresses,
        (state, account: Account) => selectTouchedAddresses(state, account.key),
    ],
    (addresses, touchedAddresses): SignAddressGroup[] => {
        const usedPaths = new Set(addresses?.used.map(({ path }) => path));
        // An address shown on the device that has received funds since is listed as used only.
        const freshAddresses = touchedAddresses.length
            ? touchedAddresses.filter(({ path }) => !usedPaths.has(path))
            : (addresses?.unused.slice(0, 1) ?? []);

        const groups: SignAddressGroup[] = [
            { category: 'fresh', addresses: freshAddresses.map(toSignAddress) },
            {
                category: 'used',
                addresses: (addresses?.used ?? []).toReversed().map(toSignAddress),
            },
            {
                category: 'change',
                addresses: (addresses?.change ?? []).toReversed().map(toSignAddress),
            },
        ];

        return groups.filter(group => group.addresses.length > 0);
    },
);
