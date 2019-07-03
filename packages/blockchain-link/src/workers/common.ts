import { Response, BlockchainSettings, SubscriptionAccountInfo } from '../types';
import { MESSAGES, RESPONSES } from '../constants';
import { CustomError } from '../constants/errors';

declare function postMessage(data: Response): void;

let _settings: BlockchainSettings;
let _debugPrefix: string;
let _addresses: string[] = [];
let _accounts: SubscriptionAccountInfo[] = [];
const _subscription: { [key: string]: boolean } = {};

const removeEmpty = (obj: Response) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') removeEmpty(obj[key]);
        else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
};

export const setSettings = (s: BlockchainSettings): void => {
    _settings = s;
    _debugPrefix = `[Worker "${s.name}"]:`;
};

export const getSettings = (): BlockchainSettings => _settings;

export const debug = (...args: any[]): void => {
    if (_settings && _settings.debug) {
        if (args[0] === 'warn' || args[0] === 'error') {
            console[args[0]](_debugPrefix, ...args.slice(1));
        } else {
            console.log(_debugPrefix, ...args);
        }
    }
};

export const handshake = (): void => {
    postMessage({
        id: -1,
        type: MESSAGES.HANDSHAKE,
    });
};

export const errorHandler = ({ id, error }: { id: number, error: any }): void => {
    let code: string = 'blockchain_link/unknown';
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
    //         code = error.code;
    //     }
    // }
    const message: string = error.message;
    if (error.code) {
        code = error.code;
    }

    postMessage({
        id,
        type: RESPONSES.ERROR,
        payload: {
            code,
            message,
        },
    });
};

export const response = (data: Response) => {
    postMessage(removeEmpty(data));
};

const validateAddresses = (addresses: string[]) => {
    if (!Array.isArray(addresses)) throw new CustomError('invalid_param', '+addresses');
    const seen = {};
    return addresses.filter(a => {
        if (typeof a !== 'string') return false;
        return seen.hasOwnProperty(a) ? false : (seen[a] = true);
    });
};

export const addAddresses = (addresses: string[]) => {
    const unique = validateAddresses(addresses).filter(a => _addresses.indexOf(a) < 0);
    _addresses = _addresses.concat(unique);
    return unique;
};

export const getAddresses = () => _addresses;

export const removeAddresses = (addresses: string[]) => {
    const unique = validateAddresses(addresses);
    _addresses = _addresses.filter(a => unique.indexOf(a) < 0);
    return _addresses;
};

const validateAccounts = (
    accounts: SubscriptionAccountInfo[]
): SubscriptionAccountInfo[] => {
    if (!Array.isArray(accounts)) throw new CustomError('invalid_param', '+accounts');
    const seen = {};
    return accounts.filter(a => {
        if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
            return seen.hasOwnProperty(a.descriptor) ? false : (seen[a.descriptor] = true);
        }
        return false;
    });
};

const getAccountAddresses = (account: SubscriptionAccountInfo) => {
    if (account.addresses) {
        const { change, used, unused } = account.addresses;
        return change.concat(used, unused).map(a => a.address);
    }
    return [account.descriptor];
};

export const addAccounts = (
    accounts: SubscriptionAccountInfo[]
): SubscriptionAccountInfo[] => {
    const valid = validateAccounts(accounts);
    const others = _accounts.filter(a => !valid.find(b => b.descriptor === a.descriptor));
    _accounts = others.concat(valid);
    const addresses = _accounts.reduce((addr, acc) => {
        return addr.concat(getAccountAddresses(acc));
    }, [] as string[]);
    addAddresses(addresses);
    return valid;
};

export const getAccount = (address: string): SubscriptionAccountInfo | undefined => {
    return _accounts.find(a => {
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

export const getAccounts = () => _accounts;

export const removeAccounts = (
    accounts: SubscriptionAccountInfo[]
): SubscriptionAccountInfo[] => {
    const valid = validateAccounts(accounts);
    const accountsToRemove = _accounts.filter(a => valid.find(b => b.descriptor === a.descriptor));
    const addressesToRemove = accountsToRemove.reduce((addr, acc) => {
        return addr.concat(getAccountAddresses(acc));
    }, [] as string[]);
    _accounts = _accounts.filter(a => accountsToRemove.indexOf(a) < 0);
    removeAddresses(addressesToRemove);
    return _accounts;
};

export const addSubscription = (type: string): void => {
    _subscription[type] = true;
};

export const getSubscription = (type: string): boolean => _subscription[type];

export const removeSubscription = (type: string): void => {
    delete _subscription[type];
};

export const clearSubscriptions = (): void => {
    Object.keys(_subscription).forEach(key => {
        delete _subscription[key];
    });
};

export const shuffleEndpoints = (a: string[]) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
