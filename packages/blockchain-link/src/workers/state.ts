import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';
import { CustomError } from '@trezor/blockchain-link-types';
import { Cache } from '@trezor/utils';

export class WorkerState {
    addresses: string[];
    accounts: SubscriptionAccountInfo[];
    subscription: { [key: string]: unknown };
    cache: Cache;
    url?: string;
    // Mirrors `addresses` for O(1) membership checks; `addresses` stays authoritative for order.
    private subscribedAddresses: Set<string>;

    constructor() {
        this.addresses = [];
        this.accounts = [];
        this.subscription = {};
        this.cache = new Cache();
        this.subscribedAddresses = new Set();
    }

    private validateAddresses(addr: string[]) {
        if (!Array.isArray(addr)) throw new CustomError('invalid_param', '+addresses');
        const seen = new Set<string>();

        return addr.filter(a => {
            if (typeof a !== 'string') return false;
            if (seen.has(a)) return false;
            seen.add(a);

            return true;
        });
    }

    addAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr).filter(a => !this.subscribedAddresses.has(a));
        // Reassign, never push: callers diff against the array a previous getAddresses() returned.
        this.addresses = this.addresses.concat(unique);
        unique.forEach(a => this.subscribedAddresses.add(a));

        return unique;
    }

    getAddresses() {
        return this.addresses;
    }

    removeAddresses(addr: string[]) {
        const toRemove = new Set(this.validateAddresses(addr));
        this.addresses = this.addresses.filter(a => !toRemove.has(a));
        toRemove.forEach(a => this.subscribedAddresses.delete(a));

        return this.addresses;
    }

    private validateAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        if (!Array.isArray(acc)) throw new CustomError('invalid_param', '+accounts');
        const seen = new Set<string>();

        return acc.filter(a => {
            if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
                if (seen.has(a.descriptor)) return false;
                seen.add(a.descriptor);

                return true;
            }

            return false;
        });
    }

    private getAccountAddresses(acc: SubscriptionAccountInfo) {
        if (acc.addresses) {
            const { change, used, unused } = acc.addresses;

            return change.concat(used, unused).map(a => a.address);
        }

        return [acc.descriptor];
    }

    addAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const validDescriptors = new Set(valid.map(a => a.descriptor));
        const others = this.accounts.filter(a => !validDescriptors.has(a.descriptor));
        this.accounts = others.concat(valid);
        const addresses = this.accounts.flatMap(a => this.getAccountAddresses(a));
        this.addAddresses(addresses);

        return valid;
    }

    getAccount(address: string): SubscriptionAccountInfo | undefined {
        return this.accounts.find(a => {
            if (a.descriptor === address) return true;
            if (a.addresses) {
                const { change, used, unused } = a.addresses;
                if (change.find(ad => ad.address === address)) return true;
                if (used.find(ad => ad.address === address)) return true;
                if (unused.find(ad => ad.address === address)) return true;
            }

            return false;
        });
    }

    getAccounts() {
        return this.accounts;
    }

    removeAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const validDescriptors = new Set(valid.map(a => a.descriptor));
        const accountsToRemove = this.accounts.filter(a => validDescriptors.has(a.descriptor));
        const addressesToRemove = accountsToRemove.flatMap(a => this.getAccountAddresses(a));
        this.accounts = this.accounts.filter(a => !validDescriptors.has(a.descriptor));
        this.removeAddresses(addressesToRemove);

        return this.accounts;
    }

    addSubscription(type: string, id: unknown = true) {
        this.subscription[type] = id;
    }

    getSubscription(type: string) {
        return this.subscription[type];
    }

    hasSubscriptions() {
        return Object.keys(this.subscription).length > 0;
    }

    removeSubscription(type: string) {
        delete this.subscription[type];
    }

    clearSubscriptions() {
        Object.keys(this.subscription).forEach(key => {
            delete this.subscription[key];
        });
    }

    cleanup() {
        this.removeAccounts(this.getAccounts());
        this.removeAddresses(this.getAddresses());
        this.clearSubscriptions();
    }
}
