import { Response, BlockchainSettings, SubscriptionAccountInfo } from '../types';
import { MESSAGES, RESPONSES } from '../constants';
import { CustomError } from '../constants/errors';

declare function postMessage(data: Response): void;

let settings: BlockchainSettings;
let debugPrefix: string;
let addresses: string[] = [];
let accounts: SubscriptionAccountInfo[] = [];
const subscription: { [key: string]: boolean } = {};

const removeEmpty = (obj: Response) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') removeEmpty(obj[key]);
        else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
};

export const setSettings = (s: BlockchainSettings): void => {
    settings = s;
    debugPrefix = `[Worker "${s.name}"]:`;
};

export const getSettings = (): BlockchainSettings => settings;

export const debug = (...args: any[]): void => {
    if (settings && settings.debug) {
        if (args[0] === 'warn' || args[0] === 'error') {
            console[args[0]](debugPrefix, ...args.slice(1));
        } else {
            console.log(debugPrefix, ...args);
        }
    }
};

export const handshake = (): void => {
    postMessage({
        id: -1,
        type: MESSAGES.HANDSHAKE,
    });
};

export const errorHandler = ({ id, error }: { id: number; error: any }): void => {
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

    postMessage({
        id,
        type: RESPONSES.ERROR,
        payload: {
            code: errorCode,
            message,
        },
    });
};

export const response = (data: Response) => {
    postMessage(removeEmpty(data));
};

const validateAddresses = (addr: string[]) => {
    if (!Array.isArray(addr)) throw new CustomError('invalid_param', '+addresses');
    const seen = [];
    return addr.filter(a => {
        if (typeof a !== 'string') return false;
        if (seen.indexOf(a) >= 0) return false;
        seen.push(a);
        return true;
    });
};

export const addAddresses = (addr: string[]) => {
    const unique = validateAddresses(addr).filter(a => addresses.indexOf(a) < 0);
    addresses = addr.concat(unique);
    return unique;
};

export const getAddresses = () => addresses;

export const removeAddresses = (addr: string[]) => {
    const unique = validateAddresses(addr);
    addresses = addresses.filter(a => unique.indexOf(a) < 0);
    return addresses;
};

const validateAccounts = (acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] => {
    if (!Array.isArray(acc)) throw new CustomError('invalid_param', '+accounts');
    const seen = [];
    return acc.filter(a => {
        if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
            if (seen.indexOf(a) >= 0) return false;
            seen.push(a);
            return true;
        }
        return false;
    });
};

const getAccountAddresses = (acc: SubscriptionAccountInfo) => {
    if (acc.addresses) {
        const { change, used, unused } = acc.addresses;
        return change.concat(used, unused).map(a => a.address);
    }
    return [acc.descriptor];
};

export const addAccounts = (acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] => {
    const valid = validateAccounts(acc);
    const others = accounts.filter(a => !valid.find(b => b.descriptor === a.descriptor));
    accounts = others.concat(valid);
    const addresses = accounts.reduce(
        (addr, a) => {
            return addr.concat(getAccountAddresses(a));
        },
        [] as string[]
    );
    addAddresses(addresses);
    return valid;
};

export const getAccount = (address: string): SubscriptionAccountInfo | undefined => {
    return accounts.find(a => {
        if (a.descriptor === address) return true;
        if (a.addresses) {
            const { change, used, unused } = a.addresses;
            if (change.find(ad => ad.address === address)) return true;
            if (used.find(ad => ad.address === address)) return true;
            if (unused.find(ad => ad.address === address)) return true;
        }
        return false;
    });
};

export const getAccounts = () => accounts;

export const removeAccounts = (acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] => {
    const valid = validateAccounts(acc);
    const accountsToRemove = accounts.filter(a => valid.find(b => b.descriptor === a.descriptor));
    const addressesToRemove = accountsToRemove.reduce(
        (addr, acc) => {
            return addr.concat(getAccountAddresses(acc));
        },
        [] as string[]
    );
    accounts = accounts.filter(a => accountsToRemove.indexOf(a) < 0);
    removeAddresses(addressesToRemove);
    return accounts;
};

export const addSubscription = (type: string): void => {
    subscription[type] = true;
};

export const getSubscription = (type: string): boolean => subscription[type];

export const removeSubscription = (type: string): void => {
    delete subscription[type];
};

export const clearSubscriptions = (): void => {
    Object.keys(subscription).forEach(key => {
        delete subscription[key];
    });
};

export const shuffleEndpoints = (a: string[]) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
