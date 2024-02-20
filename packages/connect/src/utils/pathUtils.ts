// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/pathUtils.js

import { PROTO, ERRORS } from '../constants';
import type {
    CoinInfo,
    DerivationPath,
    ProtoWithDerivationPath,
    ProtoWithAddressN,
} from '../types';

export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number) => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number) => (n & ~HD_HARDENED) >>> 0;
export const getSlip44ByPath = (path: number[]) => fromHardened(path[1]);

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

export const isSegwitPath = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(49);

export const isBech32Path = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardened(84);

export const isTaprootPath = (path: number[] | undefined) =>
    Array.isArray(path) && (path[0] === toHardened(86) || path[0] === toHardened(10025));

export const getAccountType = (path: number[] | undefined) => {
    if (isTaprootPath(path)) return 'p2tr';
    if (isBech32Path(path)) return 'p2wpkh';
    if (isSegwitPath(path)) return 'p2sh';

    return 'p2pkh';
};

/**
 * Guess script type by path. If not successful, return undefined and PAYTOADDRESS will be used (see default in protobuf)
 */
export const getScriptType = (
    path: number[] | undefined,
): PROTO.InternalInputScriptType | undefined => {
    if (!Array.isArray(path) || path.length < 1) return undefined;

    const p1 = fromHardened(path[0]);
    switch (p1) {
        case 44:
            return 'SPENDADDRESS';

        // https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki#script
        case 48: {
            if (path.length < 4) return undefined;

            const p3 = fromHardened(path[3]);

            switch (p3) {
                case 0:
                    return 'SPENDMULTISIG';
                case 1:
                    return 'SPENDP2SHWITNESS';
                case 2:
                    return 'SPENDWITNESS';
                default:
                    return undefined;
            }
        }
        case 49:
            return 'SPENDP2SHWITNESS';
        case 84:
            return 'SPENDWITNESS';
        // 10025 - SLIP-25 https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
        case 86:
        case 10025:
            return 'SPENDTAPROOT';
        default:
            return undefined;
    }
};

/**
 * Guess output script type by path. If not successful return undefined and PAYTOADDRESS will be used (see default in protobuf),
 */
export const getOutputScriptType = (path?: number[]): PROTO.ChangeOutputScriptType | undefined => {
    if (!Array.isArray(path) || path.length < 1) return undefined;

    const p = fromHardened(path[0]);

    switch (p) {
        case 44:
            return 'PAYTOADDRESS';

        // https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki#script
        case 48: {
            if (path.length < 4) return undefined;

            const p3 = fromHardened(path[3]);
            switch (p3) {
                case 0:
                    return 'PAYTOMULTISIG';
                case 1:
                    return 'PAYTOP2SHWITNESS';
                case 2:
                    return 'PAYTOWITNESS';

                default:
                    return undefined;
            }
        }

        case 49:
            return 'PAYTOP2SHWITNESS';
        case 84:
            return 'PAYTOWITNESS';
        // 10025 - SLIP-25 https://github.com/satoshilabs/slips/blob/master/slip-0025.md#public-key-derivation
        case 86:
        case 10025:
            return 'PAYTOTAPROOT';
        default:
            return undefined;
    }
};

export const validatePath = (path: DerivationPath, length = 0, base = false): number[] => {
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

export const fixPath = <
    T extends
        | ProtoWithDerivationPath<PROTO.TxInputType>
        | ProtoWithDerivationPath<PROTO.TxOutputType>,
>(
    utxo: T,
): ProtoWithAddressN<T> => {
    // make sure bip32 indices are unsigned
    if (utxo.address_n && Array.isArray(utxo.address_n)) {
        utxo.address_n = utxo.address_n.map(i => i >>> 0);
    }
    // make sure that address_n is an array
    if (utxo.address_n && typeof utxo.address_n === 'string') {
        utxo.address_n = getHDPath(utxo.address_n);
    }

    return utxo as ProtoWithAddressN<T>;
};

export const getLabel = (label: string, coinInfo?: CoinInfo) => {
    if (coinInfo) {
        return label.replace('#NETWORK', coinInfo.label);
    }

    return label.replace('#NETWORK', '');
};
