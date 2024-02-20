import { isNotUndefined, arrayDistinct, objectPartition } from '@trezor/utils';
import { addressToScripthash } from './transform';
import type { Network } from '@trezor/utxo-lib';
import type { AccountAddresses, SubscriptionAccountInfo } from '@trezor/blockchain-link-types/lib';

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

    const addAddresses = (addresses: string[]) => {
        const toAdd = addresses.filter(arrayDistinct).filter(addr => !subscribedAddrs[addr]);
        const network = getNetwork();

        subscribedAddrs = toAdd.reduce<AddressMap>(
            (dic, addr) => ({
                ...dic,
                [addr]: addressToScripthash(addr, network),
            }),
            subscribedAddrs,
        );

        return toAdd.map(addr => subscribedAddrs[addr]);
    };

    const removeAddresses = (addresses?: string[]) => {
        const [toRemove, toPreserve] = addresses
            ? objectPartition(subscribedAddrs, addresses)
            : [subscribedAddrs, {}];

        subscribedAddrs = toPreserve;

        return Object.values(toRemove);
    };

    const addAccounts = (accounts: SubscriptionAccountInfo[]) => {
        const toAdd = accounts.filter(acc => !subscribedAccs[acc.descriptor]);

        subscribedAccs = toAdd.reduce<AccountMap>(
            (dic, acc) => ({
                ...dic,
                [acc.descriptor]: acc.addresses || { change: [], used: [], unused: [] },
            }),
            subscribedAccs,
        );

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

        const addresses = addressesFromAccounts(Object.values(toRemove));

        return removeAddresses(addresses);
    };

    const getCount = () => Object.keys(subscribedAddrs).length;

    const getInfo = (scripthash: string) => {
        const [address, _sh] =
            Object.entries(subscribedAddrs).find(([_addr, sh]) => sh === scripthash) || [];
        if (!address) return { descriptor: scripthash };
        const [account, addresses] =
            Object.entries(subscribedAccs).find(
                ([_acc, { change, unused, used }]) =>
                    !!change.concat(used, unused).find(ad => ad.address === address),
            ) || [];

        return {
            descriptor: account || address,
            addresses,
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
