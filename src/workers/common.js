/* @flow */

import { MESSAGES, RESPONSES } from '../constants';
import type { Response, BlockchainSettings } from '../types';

declare function postMessage(data: Response): void;

let _settings: BlockchainSettings;
let _debugPrefix: string;
let _addresses: Array<string> = [];

export const setSettings = (s: BlockchainSettings): void => {
    _settings = s;
    _debugPrefix = `[Worker "${s.name}"]:`;
}

export const getSettings = (): BlockchainSettings => {
    return _settings;
}

export const debug = (...args: Array<any>): void => {
    if (_settings && _settings.debug) {
        if (args[0] === 'warn' || args[0] === 'error') {
            console[args[0]](_debugPrefix, ...args.slice(1));
        } else {
            console.log(_debugPrefix, ...args)
        }
    }
} 

export const handshake = (): void => {
    postMessage({
        id: -1,
        type: MESSAGES.HANDSHAKE,
    });
}

export const errorHandler = ({ id, error }: { id: number, error: Error}): void => {
    postMessage({
        id,
        type: RESPONSES.ERROR,
        error: error.message
    });
}

export const addAddresses = (addresses: Array<string>): Array<string> => {
    const unique = addresses.filter(a => _addresses.indexOf(a) < 0);
    _addresses = _addresses.concat(unique);
    return unique;
}

export const getAddresses = (): Array<string> => {
    return _addresses;
}

export const removeAddresses = (addresses: Array<string>): Array<string> => {
    _addresses = _addresses.filter(a => addresses.indexOf(a) < 0);
    return _addresses;
}