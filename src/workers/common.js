/* @flow */

import { MESSAGES, RESPONSES } from '../constants';
import type { Response, BlockchainSettings } from '../types';

declare function postMessage(data: Response): void;

let _settings: BlockchainSettings;
let _addresses: Array<string> = [];

export const setSettings = (s: BlockchainSettings): void => {
    _settings = s;
}

export const getSettings = (): BlockchainSettings => {
    return _settings;
}

export const debug = (...args: Array<any>): void => {
    if (_settings && _settings.debug)
        console.log('RippleWorker', ...args)
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

export const addAddresses = (addresses: Array<string>): void => {
    const unique = addresses.filter(a => _addresses.indexOf(a) < 0);
    _addresses.concat(unique);
}

export const getAddresses = (): Array<string> => {
    return _addresses;
}

export const removeAddresses = (addresses: Array<string>): void => {
    _addresses = _addresses.filter(a => addresses.indexOf(a) < 0);
}