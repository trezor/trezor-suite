import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import {
    getReceiveAddressForFlowEntry,
    getReceiveAddressHistoryList,
    getReceiveAddressToAdd,
} from './getReceiveAddressHistory';

type AccountAddress = NonNullable<Account['addresses']>['used'][number];

const ACCOUNT_DESCRIPTOR = asAccountDescriptor(
    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
);

const createAddress = (index: number, transfers = 0): AccountAddress => ({
    address: `address-${index}`,
    path: `m/84'/0'/0'/0/${index}`,
    transfers,
    balance: '0',
    sent: '0',
    received: '0',
});

const createCardanoAddress = (index: number, transfers = 0): AccountAddress => ({
    address: `cardano-address-${index}`,
    path: `m/1852'/1815'/0'/0/${index}`,
    transfers,
    balance: '0',
    sent: '0',
    received: '0',
});

const createAccount = (
    addresses: AccountAddress[],
    descriptor = asAccountDescriptor('descriptor'),
) =>
    mockWalletAccount({
        symbol: 'btc',
        descriptor,
        addresses: {
            used: [],
            unused: addresses,
            change: [],
        },
    });

describe(getReceiveAddressForFlowEntry.name, () => {
    it('returns the first untouched address and ignores the previously displayed address', () => {
        const currentFreshAddress = createAddress(3);
        const labeledAddress = createAddress(4);
        const account = createAccount([currentFreshAddress, labeledAddress, createAddress(5)]);

        const address = getReceiveAddressForFlowEntry({
            account,
            touchedAddresses: [],
            labeledUnusedAddresses: [
                { path: labeledAddress.path, address: labeledAddress.address },
            ],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address?.path).toBe("m/84'/0'/0'/0/5");
    });

    it('returns the highest loaded unused address when touched addresses exhaust the loaded gap', () => {
        const addresses = Array.from({ length: 20 }, (_, index) => createAddress(index));
        const account = createAccount(addresses);

        const address = getReceiveAddressForFlowEntry({
            account,
            touchedAddresses: addresses.map(({ path, address: addressValue }) => ({
                path,
                address: addressValue,
            })),
            labeledUnusedAddresses: [],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address?.path).toBe("m/84'/0'/0'/0/19");
    });

    it('returns the highest loaded unused address when the highest loaded unused address is labeled', () => {
        const addresses = Array.from({ length: 20 }, (_, index) => createAddress(index));
        const account = createAccount(addresses, ACCOUNT_DESCRIPTOR);
        const highestAddress = addresses[19];

        const address = getReceiveAddressForFlowEntry({
            account,
            touchedAddresses: [],
            labeledUnusedAddresses: highestAddress
                ? [{ path: highestAddress.path, address: highestAddress.address }]
                : [],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address?.path).toBe(highestAddress?.path);
    });

    it('returns the first unused address above a used address path', () => {
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [createAddress(18), createAddress(21)],
                change: [],
            },
        });

        const address = getReceiveAddressForFlowEntry({
            account,
            touchedAddresses: [],
            labeledUnusedAddresses: [],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address?.path).toBe("m/84'/0'/0'/0/21");
    });

    it('does not return an unused address below a used address path', () => {
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [createAddress(18)],
                change: [],
            },
        });

        const address = getReceiveAddressForFlowEntry({
            account,
            touchedAddresses: [],
            labeledUnusedAddresses: [],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address).toBeUndefined();
    });
});

describe(getReceiveAddressToAdd.name, () => {
    it('treats the current receive address as already reserved', () => {
        const currentFreshAddress = createAddress(3);
        const account = createAccount([currentFreshAddress, createAddress(4)]);

        const address = getReceiveAddressToAdd({
            account,
            touchedAddresses: [],
            labeledUnusedAddresses: [],
            pendingAddresses: [],
            currentFreshAddress,
            isAccountUtxoBased: true,
        });

        expect(address?.path).toBe("m/84'/0'/0'/0/4");
    });

    it('returns undefined when there is no prepared address to add', () => {
        const addresses = Array.from({ length: 20 }, (_, index) => createAddress(index));
        const account = createAccount(addresses, ACCOUNT_DESCRIPTOR);
        const highestAddress = addresses[19];

        const address = getReceiveAddressToAdd({
            account,
            touchedAddresses: addresses.map(({ path, address: addressValue }) => ({
                path,
                address: addressValue,
            })),
            labeledUnusedAddresses: highestAddress
                ? [{ path: highestAddress.path, address: highestAddress.address }]
                : [],
            pendingAddresses: [],
            isAccountUtxoBased: true,
        });

        expect(address).toBeUndefined();
    });
});

describe(getReceiveAddressHistoryList.name, () => {
    it('keeps an unlabeled unused address when its path is lower than a used address path', () => {
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [
                    createAddress(18), // this shall be used because its path (18) is < path of used address (20)
                    createAddress(21),
                ],
                change: [],
            },
        });

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(addresses.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20", "m/84'/0'/0'/0/18"]);
    });

    it('keeps an unlabeled Cardano unused address when its path is lower than a used address path', () => {
        const account = mockWalletAccount(
            {
                symbol: 'ada',
                addresses: {
                    used: [createCardanoAddress(20, 1)],
                    unused: [createCardanoAddress(18), createCardanoAddress(21)],
                    change: [],
                },
            },
            networkSpecificDefaultCardano,
        );

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(addresses.map(({ path }) => path)).toEqual([
            "m/1852'/1815'/0'/0/20",
            "m/1852'/1815'/0'/0/18",
        ]);
    });

    it('does not compare paths from different address branches', () => {
        const changeAddress = {
            ...createAddress(18),
            path: "m/84'/0'/0'/1/18",
        };
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [changeAddress],
                change: [],
            },
        });

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(addresses.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20"]);
    });

    it('includes the current receive address without exposing lower untouched addresses', () => {
        const currentFreshAddress = createAddress(3);
        const account = createAccount([createAddress(1), createAddress(2), currentFreshAddress]);

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
            currentFreshAddress,
        });

        expect(addresses.map(({ path }) => path)).toEqual([currentFreshAddress.path]);
    });

    it('orders current, touched, and labeled receive addresses by highest index first', () => {
        const currentFreshAddress = createAddress(3);
        const labeledAddress = createAddress(4);
        const touchedAddress = createAddress(5);
        const account = createAccount([currentFreshAddress, labeledAddress, touchedAddress]);

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [{ path: touchedAddress.path, address: touchedAddress.address }],
            pendingAddresses: [],
            addressLabels: {
                [labeledAddress.address]: 'Invoice',
            },
            currentFreshAddress,
        });

        expect(addresses.map(({ path }) => path)).toEqual([
            touchedAddress.path,
            labeledAddress.path,
            currentFreshAddress.path,
        ]);
    });

    it('keeps skipped addresses below durable address history entries', () => {
        const skippedAddress = createAddress(4);
        const labeledAddress = createAddress(5);
        const currentFreshAddress = createAddress(6);
        const account = createAccount([skippedAddress, labeledAddress, currentFreshAddress]);

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {
                [labeledAddress.address]: 'Invoice',
            },
            currentFreshAddress,
        });

        expect(addresses.map(({ path }) => path)).toEqual([
            currentFreshAddress.path,
            labeledAddress.path,
            skippedAddress.path,
        ]);
    });

    it('removes an unused address after its label is removed when it is not below any used path', () => {
        const address = createAddress(18);
        const account = createAccount([address]);

        const addressesWithLabel = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {
                [address.address]: 'label',
            },
        });

        expect(addressesWithLabel.map(({ path }) => path)).toEqual([address.path]);

        const addressesWithoutLabel = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(addressesWithoutLabel.map(({ path }) => path)).toEqual([]);
    });

    it('excludes the current receive address when requested', () => {
        const address = createAddress(18);
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [address],
                change: [],
            },
        });

        const addresses = getReceiveAddressHistoryList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
            currentFreshAddress: { path: address.path },
            includeCurrentFreshAddress: false,
        });

        expect(addresses.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20"]);
    });
});
