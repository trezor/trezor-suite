// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/pathUtils.js

/* eslint-disable no-bitwise */

import { PROTO, ERRORS } from '../constants';
import type { CoinInfo } from '../types';

export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number) => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number) => (n & ~HD_HARDENED) >>> 0;

const PATH_NOT_VALID = ERRORS.TypedError('Method_InvalidParameter', 'Not a valid path');
const PATH_NEGATIVE_VALUES = ERRORS.TypedError(
    'Method_InvalidParameter',
    'Path cannot contain negative values',
);

export const getHDPath = (path: string): number[] => {
    const parts = path.toLowerCase().split('/');
    if (parts[0] !== 'm') throw PATH_NOT_VALID;
    return parts
        .filter(p => p !== 'm' && p !== '')
        .map(p => {
            let hardened = false;
            if (p.endsWith("'")) {
                hardened = true;
                p = p.substring(0, p.length - 1);
            }
            let n = parseInt(p, 10);
            if (Number.isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            if (hardened) {
                // hardened index
                n = toHardened(n);
            }
            return n;
        });
};

export const isMultisigPath = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(48);

export const isSegwitPath = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(49);

export const isBech32Path = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(84);

export const isTaprootPath = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(86);

export const getAccountType = (path: number[] | undefined) => {
    if (isTaprootPath(path)) return 'p2tr';
    if (isBech32Path(path)) return 'p2wpkh';
    if (isSegwitPath(path)) return 'p2sh';
    return 'p2pkh';
};

export const getScriptType = (path: number[] | undefined): PROTO.InternalInputScriptType => {
    if (!Array.isArray(path) || path.length < 1) return 'SPENDADDRESS';

    const p1 = fromHardened(path[0]);
    switch (p1) {
        case 48:
            return 'SPENDMULTISIG';
        case 49:
            return 'SPENDP2SHWITNESS';
        case 84:
            return 'SPENDWITNESS';
        case 86:
            return 'SPENDTAPROOT';
        default:
            return 'SPENDADDRESS';
    }
};

export const getOutputScriptType = (path?: number[]): PROTO.ChangeOutputScriptType => {
    if (!Array.isArray(path) || path.length < 1) return 'PAYTOADDRESS';

    // compatibility for Casa - allow an unhardened 49 path to use PAYTOP2SHWITNESS
    if (path[0] === 49) {
        return 'PAYTOP2SHWITNESS';
    }

    const p = fromHardened(path[0]);
    switch (p) {
        case 48:
            return 'PAYTOMULTISIG';
        case 49:
            return 'PAYTOP2SHWITNESS';
        case 84:
            return 'PAYTOWITNESS';
        case 86:
            return 'PAYTOTAPROOT';
        default:
            return 'PAYTOADDRESS';
    }
};

export const validatePath = (path: string | number[], length = 0, base = false): number[] => {
    let valid: number[] | undefined;
    if (typeof path === 'string') {
        valid = getHDPath(path);
    } else if (Array.isArray(path)) {
        valid = path.map((p: any) => {
            const n = parseInt(p, 10);
            if (Number.isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            return n;
        });
    }
    if (!valid) throw PATH_NOT_VALID;
    if (length > 0 && valid.length < length) throw PATH_NOT_VALID;
    return base ? valid.splice(0, 3) : valid;
};

export const getSerializedPath = (path: number[]) =>
    `m/${path
        .map(i => {
            const s = (i & ~HD_HARDENED).toString();
            if (i & HD_HARDENED) {
                return `${s}'`;
            }
            return s;
        })
        .join('/')}`;

export const getPathFromIndex = (bip44purpose: number, bip44cointype: number, index: number) => [
    toHardened(bip44purpose),
    toHardened(bip44cointype),
    toHardened(index),
];

export const getIndexFromPath = (path: number[]) => {
    if (path.length < 3) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `getIndexFromPath: invalid path length ${path.toString()}`,
        );
    }
    return fromHardened(path[2]);
};

export const fixPath = <T extends PROTO.TxInputType | PROTO.TxOutputType>(utxo: T): T => {
    // make sure bip32 indices are unsigned
    if (utxo.address_n && Array.isArray(utxo.address_n)) {
        utxo.address_n = utxo.address_n.map(i => i >>> 0);
    }
    // This is only a part of API wide issue: https://github.com/trezor/trezor-suite/issues/4875
    // it works only in runtime. type T needs to have address_n as string, but currently we are using Protobuf declaration
    if (utxo.address_n && typeof utxo.address_n === 'string') {
        utxo.address_n = getHDPath(utxo.address_n);
    }
    return utxo;
};

export const getLabel = (label: string, coinInfo?: CoinInfo) => {
    if (coinInfo) {
        return label.replace('#NETWORK', coinInfo.label);
    }
    return label.replace('#NETWORK', '');
};
