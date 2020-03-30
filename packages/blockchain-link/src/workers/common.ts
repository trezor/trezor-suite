import { Response, BlockchainSettings, SubscriptionAccountInfo } from '../types';
import { MESSAGES, RESPONSES } from '../constants';
import { CustomError } from '../constants/errors';

class WorkerCommon {
    post: (data: Response) => void;
    settings: BlockchainSettings;
    debugPrefix: string;
    addresses: string[];
    accounts: SubscriptionAccountInfo[];
    subscription: { [key: string]: boolean };
    constructor(postFn: (data: Response) => void) {
        this.addresses = [];
        this.accounts = [];
        this.subscription = {};
        this.settings = {
            name: 'unknown',
            worker: 'unknown',
            server: [],
        };
        this.debugPrefix = '[UnknownWorker]';
        this.post = () =>
            console.warn('BlockchainLink:workers.common: postMessage method is not set');
        if (typeof postFn !== 'undefined') {
            this.post = postFn;
        }
    }

    handshake() {
        this.post.call(null, {
            id: -1,
            type: MESSAGES.HANDSHAKE,
        });
    }

    setSettings(s: BlockchainSettings) {
        this.settings = s;
        this.debugPrefix = `[Worker "${s.name}"]:`;
    }

    getSettings() {
        return this.settings;
    }

    errorHandler({ id, error }: { id: number; error: any }) {
        let errorCode = 'blockchain_link/unknown';
        // let message: string = '';
        // this part is uncovered by tests but for some reason i've write it like this (ripple maybe)
        // TODO: remove it after
        // if (typeof error === 'string') {
        //     message = error;
        // } else if (typeof error === 'object') {
        //     const keys = Object.keys(error);
        //     if (keys.indexOf('name') >= 0) {
        //         message = error.name;
        //     } else {
        //         message = error.message;
        //     }
        //     if (error.code) {
        //         errorCode = error.code;
        //     }
        // }

        const { message } = error;
        if (error.code) {
            errorCode = error.code;
        }

        this.post.call(null, {
            id,
            type: RESPONSES.ERROR,
            payload: {
                code: errorCode,
                message,
            },
        });
    }

    response(data: Response) {
        this.post.call(null, this.removeEmpty(data));
    }

    validateAddresses(addr: string[]) {
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

    validateAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
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

    getAccountAddresses(acc: SubscriptionAccountInfo) {
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
        const addresses = this.accounts.reduce((addr, a) => {
            return addr.concat(this.getAccountAddresses(a));
        }, [] as string[]);
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
            valid.find(b => b.descriptor === a.descriptor)
        );
        const addressesToRemove = accountsToRemove.reduce((addr, acc) => {
            return addr.concat(this.getAccountAddresses(acc));
        }, [] as string[]);
        this.accounts = this.accounts.filter(a => accountsToRemove.indexOf(a) < 0);
        this.removeAddresses(addressesToRemove);
        return this.accounts;
    }

    addSubscription(type: string) {
        this.subscription[type] = true;
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

    shuffleEndpoints(a: string[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    removeEmpty(obj: Response) {
        Object.keys(obj).forEach(key => {
            if (Array.isArray(obj[key])) obj[key].map(o => this.removeEmpty(o));
            if (obj[key] && typeof obj[key] === 'object') this.removeEmpty(obj[key]);
            else if (obj[key] === undefined) delete obj[key];
        });
        return obj;
    }

    debug(...args: any[]) {
        if (this.settings && this.settings.debug) {
            if (args[0] === 'warn' || args[0] === 'error') {
                // eslint-disable-next-line no-console
                console[args[0]](this.debugPrefix, ...args.slice(1));
            } else {
                // eslint-disable-next-line no-console
                console.log(this.debugPrefix, ...args);
            }
        }
    }
}

export default WorkerCommon;
