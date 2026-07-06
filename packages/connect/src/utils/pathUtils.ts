// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/pathUtils.js
// TODO: There might be other issues with side-effects https://github.com/trezor/trezor-suite/issues/15559
import type { PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { CoinInfo } from '@trezor/connect-common/src/types/coinInfo';
import type {
    DerivationPath,
    ProtoWithAddressN,
    ProtoWithDerivationPath,
} from '@trezor/connect-common/src/types/params';
import {
    HD_HARDENED_PATH_PART,
    fromHardenedPathPart,
    getHDPath as parseHDPath,
    toHardenedPathPart,
} from '@trezor/crypto-utils';
import { arrayPartition } from '@trezor/utils';

export const getSlip44ByPath = (path: number[]) => {
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const slip44: number = path[1];

    return fromHardenedPathPart(slip44);
};

const PATH_NOT_VALID = ERRORS.TypedError('Method_InvalidParameter', 'Not a valid path');
const PATH_NEGATIVE_VALUES = ERRORS.TypedError(
    'Method_InvalidParameter',
    'Path cannot contain negative values',
);

export const getHDPath = (path: string): number[] => {
    const result = parseHDPath(path);

    if (result.success) {
        return result.payload;
    }

    if (result.error.type === 'PATH_NEGATIVE_VALUES') {
        throw PATH_NEGATIVE_VALUES;
    }

    throw PATH_NOT_VALID;
};

const isSegwitPath = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardenedPathPart(49);

const isBech32Path = (path: number[] | undefined) =>
    Array.isArray(path) && path[0] === toHardenedPathPart(84);

export const isTaprootPath = (path: number[] | undefined) =>
    Array.isArray(path) &&
    (path[0] === toHardenedPathPart(86) || path[0] === toHardenedPathPart(10025));

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

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const p0: number = path[0];
    const p1 = fromHardenedPathPart(p0);
    switch (p1) {
        case 44:
            return 'SPENDADDRESS';

        // https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki#script
        case 48: {
            if (path.length < 4) return undefined;

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const p3raw: number = path[3];
            const p3 = fromHardenedPathPart(p3raw);

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

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pRaw: number = path[0];
    const p = fromHardenedPathPart(pRaw);

    switch (p) {
        case 44:
            return 'PAYTOADDRESS';

        // https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki#script
        case 48: {
            if (path.length < 4) return undefined;

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const p3raw2: number = path[3];
            const p3 = fromHardenedPathPart(p3raw2);
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
        valid = path.map(p => {
            if (Number.isNaN(p)) {
                throw PATH_NOT_VALID;
            } else if (p < 0) {
                throw PATH_NEGATIVE_VALUES;
            }

            return p;
        });
    }
    if (!valid) throw PATH_NOT_VALID;
    if (length > 0 && valid.length < length) throw PATH_NOT_VALID;

    return base ? valid.splice(0, 3) : valid;
};

export const getSerializedPath = (path: number[]) =>
    `m/${path
        .map(i => {
            const s = (i & ~HD_HARDENED_PATH_PART).toString();
            if (i & HD_HARDENED_PATH_PART) {
                return `${s}'`;
            }

            return s;
        })
        .join('/')}`;

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

/** @deprecated Temporary diagnostic method */
export const __btcUnknownTxDebug__ = (
    description: string,
    inputs: { address_n?: number[]; orig_hash?: any }[],
    addresses:
        | { used: { path: string }[]; unused: { path: string }[]; change: { path: string }[] }
        | undefined,
) => {
    try {
        if (inputs.some(i => i.orig_hash)) {
            // In RBF, account's change addresses are modified so the right change address is selected,
            // therefore it's expected that the inputs can't be found in account's addresses.
            return;
        }

        const accountAddressPaths = new Set(
            addresses
                ? addresses.change.concat(addresses.used, addresses.unused).map(({ path }) => path)
                : [],
        );

        const [matched, unmatched] = arrayPartition(
            inputs
                .map(input => input.address_n)
                .filter((addr): addr is number[] => Array.isArray(addr) && addr.length > 0),
            addr => accountAddressPaths.has(getSerializedPath(addr)),
        );

        const toReadable = (address_n: number[]) =>
            `${address_n[address_n.length - 2] ? 'change' : 'receive'}/${address_n[address_n.length - 1]}`;

        if (unmatched.length) {
            // [btc-unknown-tx-debug] the selected account does not contain paths used by the tx inputs.
            // This can make Connect build a pending tx with wrong or empty vin addresses, which can then
            // classify the optimistic pending tx incorrectly before the backend response arrives.
            // Intentionally no paths / addresses / descriptor / txid: these reach Sentry and could
            // deanonymize the user. accountType + symbol are low-cardinality, non-PII.
            console.error(`[btc-unknown-tx-debug-v2] ${description}`, {
                knownUsedCount: addresses?.used.length,
                knownUnusedCount: addresses?.unused.length,
                knownChangeCount: addresses?.change.length,
                matchedInputs: matched.map(toReadable),
                unmatchedInputs: unmatched.map(toReadable),
            });
        }
    } catch {
        // empty
    }
};
