import type { AccountAddresses, SubscriptionAccountInfo } from '@trezor/blockchain-link-types/src';
import { isNotUndefined, objectPartition } from '@trezor/utils';
import type { Network } from '@trezor/utxo-lib';

import { addressToScripthash } from './transform';

type AddressMap = { [address: string]: string };
type AccountMap = { [descriptor: string]: AccountAddresses };

const addressesFromAccounts = (array: (AccountAddresses | undefined)[]) =>
    array
        .filter(isNotUndefined)
        .flatMap(({ change, used, unused }) =>
            change.concat(used, unused).map(({ address }) => address),
        );

export const createAddressManager = (getNetwork: () => Network | undefined) => {
    let subscribedAddrs: AddressMap = {};
    let subscribedAccs: AccountMap = {};
    // Reverse indexes of the maps above, so that a notification of a scripthash finds its address
    // and account without scanning all of them.
    const addressByScripthash = new Map<string, string>();
    const accountByAddress = new Map<string, string>();

    const addAddresses = (addresses: string[]) => {
        const toAdd = [...new Set(addresses)].filter(addr => !subscribedAddrs[addr]);
        const network = getNetwork();
        // Converted first, so that an invalid address leaves nothing of the batch subscribed.
        const added = toAdd.map(addr => ({ addr, scripthash: addressToScripthash(addr, network) }));

        added.forEach(({ addr, scripthash }) => {
            subscribedAddrs[addr] = scripthash;
            // Forms of one address (e.g. bech32 in upper case) share the scripthash, the first stays.
            if (!addressByScripthash.has(scripthash)) addressByScripthash.set(scripthash, addr);
        });

        return added.map(({ scripthash }) => scripthash);
    };

    const removeAddresses = (addresses?: string[]) => {
        const [toRemove, toPreserve] = addresses
            ? objectPartition(subscribedAddrs, addresses)
            : [subscribedAddrs, {}];

        subscribedAddrs = toPreserve;

        Object.entries(toRemove).forEach(([addr, scripthash]) => {
            if (addressByScripthash.get(scripthash) === addr)
                addressByScripthash.delete(scripthash);
        });

        return Object.values(toRemove);
    };

    const addAccounts = (accounts: SubscriptionAccountInfo[]) => {
        const toAdd = accounts.filter(acc => !subscribedAccs[acc.descriptor]);
        toAdd.forEach(({ descriptor, addresses }) => {
            subscribedAccs[descriptor] = addresses || { change: [], used: [], unused: [] };
        });

        // Indexed by the addresses kept for each account, e.g. the later entry of an account listed
        // twice. Accounts don't share addresses, if they did, an address would stay with the first.
        new Set(toAdd.map(({ descriptor }) => descriptor)).forEach(descriptor => {
            addressesFromAccounts([subscribedAccs[descriptor]]).forEach(addr => {
                if (!accountByAddress.has(addr)) accountByAddress.set(addr, descriptor);
            });
        });

        const addresses = addressesFromAccounts(toAdd.map(acc => acc.addresses));

        return addAddresses(addresses);
    };

    const removeAccounts = (accounts?: SubscriptionAccountInfo[]) => {
        const [toRemove, toPreserve] = accounts
            ? objectPartition(
                  subscribedAccs,
                  accounts.map(({ descriptor }) => descriptor),
              )
            : [subscribedAccs, {}];

        subscribedAccs = toPreserve;

        Object.entries(toRemove).forEach(([descriptor, accountAddresses]) => {
            addressesFromAccounts([accountAddresses]).forEach(addr => {
                if (accountByAddress.get(addr) === descriptor) accountByAddress.delete(addr);
            });
        });

        return removeAddresses(addressesFromAccounts(Object.values(toRemove)));
    };

    const getCount = () => Object.keys(subscribedAddrs).length;

    const getInfo = (scripthash: string) => {
        const address = addressByScripthash.get(scripthash);
        if (!address) return { descriptor: scripthash };
        const account = accountByAddress.get(address);

        return {
            descriptor: account || address,
            addresses: account ? subscribedAccs[account] : undefined,
        };
    };

    return {
        addAddresses,
        removeAddresses,
        addAccounts,
        removeAccounts,
        getCount,
        getInfo,
    };
};
