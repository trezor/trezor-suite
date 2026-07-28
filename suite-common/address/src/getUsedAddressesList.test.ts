import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import { getUsedAddressesList } from './getUsedAddressesList';

type AccountAddress = NonNullable<Account['addresses']>['used'][number];

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

describe(getUsedAddressesList.name, () => {
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

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(list.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20", "m/84'/0'/0'/0/18"]);
    });

    it('keeps an unlabeled skipped address below a labeled unused address', () => {
        const labeled16 = createAddress(16);
        const labeled17 = createAddress(17);
        const skipped18 = createAddress(18);
        const labeled19 = createAddress(19);

        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(15, 1)],
                unused: [labeled16, labeled17, skipped18, labeled19],
                change: [],
            },
        });

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {
                [labeled16.address]: 'label 16',
                [labeled17.address]: 'label 17',
                [labeled19.address]: 'label',
            },
        });

        expect(list.map(({ path }) => path)).toEqual([
            labeled19.path,
            skipped18.path,
            labeled17.path,
            labeled16.path,
            "m/84'/0'/0'/0/15",
        ]);
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

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(list.map(({ path }) => path)).toEqual([
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

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(list.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20"]);
    });

    it('removes an unused address after its label is removed when it is not below any used path', () => {
        const address = createAddress(18);
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [],
                unused: [address],
                change: [],
            },
        });

        const listWithLabel = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {
                [address.address]: 'label',
            },
        });

        expect(listWithLabel.map(({ path }) => path)).toEqual([address.path]);

        const listWithoutLabel = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
        });

        expect(listWithoutLabel.map(({ path }) => path)).toEqual([]);
    });

    it('includes touched, pending, and labeled unused addresses', () => {
        const touched = createAddress(1);
        const pending = createAddress(2);
        const labeled = createAddress(3);
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [],
                unused: [touched, pending, labeled],
                change: [],
            },
        });

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [
                {
                    address: touched.address,
                    path: touched.path,
                },
            ],
            pendingAddresses: [pending.address],
            addressLabels: {
                [labeled.address]: 'label',
            },
        });

        expect(list.map(({ path }) => path)).toEqual([labeled.path, pending.path, touched.path]);
    });

    it('does not include the current fresh address even when it otherwise matches', () => {
        const address = createAddress(18);
        const account = mockWalletAccount({
            symbol: 'btc',
            addresses: {
                used: [createAddress(20, 1)],
                unused: [address],
                change: [],
            },
        });

        const list = getUsedAddressesList({
            account,
            touchedAddresses: [],
            pendingAddresses: [],
            addressLabels: {},
            currentFreshAddress: { path: address.path },
        });

        expect(list.map(({ path }) => path)).toEqual(["m/84'/0'/0'/0/20"]);
    });
});
