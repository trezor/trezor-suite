import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';
import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';

export class WorkerState {
    addresses: string[];
    accounts: SubscriptionAccountInfo[];
    subscription: { [key: string]: unknown };
    constructor() {
        this.addresses = [];
        this.accounts = [];
        this.subscription = {};
    }

    private validateAddresses(addr: string[]) {
        if (!Array.isArray(addr)) throw new CustomError('invalid_param', '+addresses');
        const seen: string[] = [];
        return addr.filter(a => {
            if (typeof a !== 'string') return false;
            if (seen.indexOf(a) >= 0) return false;
            seen.push(a);
            return true;
        });
    }

    addAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr).filter(a => this.addresses.indexOf(a) < 0);
        this.addresses = this.addresses.concat(unique);
        return unique;
    }

    getAddresses() {
        return this.addresses;
    }

    removeAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr);
        this.addresses = this.addresses.filter(a => unique.indexOf(a) < 0);
        return this.addresses;
    }

    private validateAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        if (!Array.isArray(acc)) throw new CustomError('invalid_param', '+accounts');
        const seen: string[] = [];
        return acc.filter(a => {
            if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
                if (seen.indexOf(a.descriptor) >= 0) return false;
                seen.push(a.descriptor);
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
        const others = this.accounts.filter(a => !valid.find(b => b.descriptor === a.descriptor));
        this.accounts = others.concat(valid);
        const addresses = this.accounts.reduce(
            (addr, a) => addr.concat(this.getAccountAddresses(a)),
            [] as string[],
        );
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
        const accountsToRemove = this.accounts.filter(a =>
            valid.find(b => b.descriptor === a.descriptor),
        );
        const addressesToRemove = accountsToRemove.reduce(
            (addr, acc) => addr.concat(this.getAccountAddresses(acc)),
            [] as string[],
        );
        this.accounts = this.accounts.filter(a => accountsToRemove.indexOf(a) < 0);
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

    removeEmpty(obj: Record<string, any>) {
        Object.keys(obj).forEach(key => {
            if (Array.isArray(obj[key])) obj[key].map((o: any) => this.removeEmpty(o));
            if (obj[key] && typeof obj[key] === 'object') this.removeEmpty(obj[key]);
            else if (obj[key] === undefined) delete obj[key];
        });
        return obj;
    }

    cleanup() {
        this.removeAccounts(this.getAccounts());
        this.removeAddresses(this.getAddresses());
        this.clearSubscriptions();
    }
}
