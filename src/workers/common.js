/* @flow */

import type { Response, BlockchainSettings } from '../types';
import { MESSAGES, RESPONSES } from '../constants';

declare function postMessage(data: Response): void;

let _settings: BlockchainSettings;
let _debugPrefix: string;
let _addresses: Array<string> = [];
const _subscription: { [key: string]: boolean } = {};

export const setSettings = (s: BlockchainSettings): void => {
    _settings = s;
    _debugPrefix = `[Worker "${s.name}"]:`;
};

export const getSettings = (): BlockchainSettings => _settings;

export const debug = (...args: Array<any>): void => {
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
    let message: string = '';
    if (typeof error === 'string') {
        message = error;
    } else if (typeof error === 'object') {
        const keys = Object.keys(error);
        if (keys.indexOf('name') >= 0) {
            message = error.name;
        } else {
            message = error.message;
        }
        if (error.code) {
            code = error.code;
        }
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

export const response = (data: Response): void => {
    postMessage(data);
};

const getUniqueInput = (addresses: Array<string>): Array<string> => {
    if (!Array.isArray(addresses)) return [];
    const seen = {};
    return addresses.filter(a => {
        if (typeof a !== 'string') return false;
        return seen.hasOwnProperty(a) ? false : (seen[a] = true);
    });
};

export const addAddresses = (addresses: Array<string>): Array<string> => {
    const unique = getUniqueInput(addresses).filter(a => _addresses.indexOf(a) < 0);
    _addresses = _addresses.concat(unique);
    return unique;
};

export const getAddresses = (): Array<string> => _addresses;

export const removeAddresses = (addresses: Array<string>): Array<string> => {
    const unique = getUniqueInput(addresses);
    _addresses = _addresses.filter(a => unique.indexOf(a) < 0);
    return _addresses;
};

export const addSubscription = (type: string): void => {
    _subscription[type] = true;
};

export const getSubscription = (type: string): boolean => _subscription[type];

export const removeSubscription = (type: string): void => {
    delete _subscription[type];
};

export const clearSubscriptions = (): void => {
    Object.keys(_subscription).forEach(key => (_subscription[key] = false));
};

export const shuffleEndpoints = (a: Array<string>): Array<string> => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // $FlowIssue
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
