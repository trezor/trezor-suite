import { NetworkSymbol, getNetworkDisplaySymbol, networks } from '@suite-common/wallet-config';
import type { TokenTransfer } from '@trezor/connect';
import { BigNumber, BigNumberValue } from '@trezor/utils';

import { AmountSubunit, AmountUnit, asAmountSubunit, asAmountUnit } from './AmountTypes';

export const getAccountDecimals = (symbol: NetworkSymbol) => networks[symbol]?.decimals;

type SubunitsToUnitsParams = { value: AmountSubunit } & SymbolOrDecimals;

/**
 * Converts Sats to Bitcoin (and similarly for other coins)
 */
export const subunitsToUnits = (params: SubunitsToUnitsParams): AmountUnit => {
    const decimals = 'decimals' in params ? params.decimals : getAccountDecimals(params.symbol);

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return asAmountUnit(params.value.div(factor));
};

type SymbolOrDecimals = { symbol: NetworkSymbol } | { decimals: number };

type UnitsToSubunitsParams = { value: AmountUnit } & SymbolOrDecimals;

/**
 * Converts Bitcoins to Sats (and similarly for other coins)
 */
export const unitsToSubunits = (params: UnitsToSubunitsParams): AmountSubunit => {
    const decimals = 'decimals' in params ? params.decimals : getAccountDecimals(params.symbol);

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return asAmountSubunit(params.value.multipliedBy(factor));
};

/**
 * Sats -> BTC, etc...
 *
 * @deprecated Use `subunitsToUnits` instead!
 */
export const convertAmountSubunitsToUnits = (amount: BigNumberValue, decimals: number) => {
    const safeAmount = amount || '0';
    const bAmount = new BigNumber(safeAmount);

    if (bAmount.isNaN()) {
        throw new Error('Amount is not a number');
    }

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return bAmount.div(factor).toString(10);
};

/**
 * BTC -> Sats, etc...
 *
 * @deprecated Use `unitsToSubunits` instead!
 */
export const convertAmountUnitsToSubunits = (amount: BigNumberValue, decimals: number) => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }

        return bAmount.times(10 ** decimals).toString(10);
    } catch {
        // TODO: return null, so we can decide how to handle missing value in caller component
        return '-1';
    }
};

/**
 * @deprecated Use `subunitsToUnits` instead!
 */
export const satoshiAmountToBtc = (amount: BigNumberValue) => {
    try {
        const satsAmount = new BigNumber(amount);
        if (satsAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }

        return satsAmount.times(10 ** -8).toString(10);
    } catch {
        // TODO: return null, so we can decide how to handle missing value in caller component
        return '-1';
    }
};

/**
 * @deprecated Use `subunitsToUnits` instead!
 */
export const networkAmountToSmallestUnit = (amount: string | null, symbol: NetworkSymbol) => {
    if (!amount) return '0';

    const decimals = getAccountDecimals(symbol);

    if (!decimals) return amount;

    return convertAmountUnitsToSubunits(amount, decimals);
};

/**
 * @deprecated use `subunitsToUnits` if you don't need formatting. If you need formating, use function that does ONLY formatting.
 */
export const formatNetworkAmount = (
    amount: string,
    symbol: NetworkSymbol,
    withSymbol = false,
    isSatoshis?: boolean,
) => {
    const decimals = getAccountDecimals(symbol);

    if (!decimals) return amount;

    let formattedAmount = convertAmountSubunitsToUnits(amount, decimals);

    if (withSymbol) {
        let formattedSymbol = getNetworkDisplaySymbol(symbol);

        if (isSatoshis) {
            formattedAmount = amount || '0';
            formattedSymbol = `sat ${getNetworkDisplaySymbol(symbol)}`;
        }

        return `${formattedAmount} ${formattedSymbol}`;
    }

    return formattedAmount;
};

export const formatTokenAmount = (tokenTransfer: TokenTransfer) => {
    const formattedAmount = convertAmountSubunitsToUnits(
        tokenTransfer.amount,
        tokenTransfer.decimals,
    );

    return tokenTransfer.symbol ? `${formattedAmount} ${tokenTransfer.symbol}` : formattedAmount;
};

type formatBigUintToLEParams = {
    /** The BigNumber value to format, must be non-negative and an integer. */
    value: BigNumber;
    /** The byte length of the output string. */
    bytesLength: number;
};

/**
 * Formats BigNumber to little-endian hex string of given byte length.
 * @returns A little-endian hex string.
 * @throws {Error} If the value is negative, not an integer, or exceeds the specified byte length.
 */
export const formatBigUintToLE = (params: formatBigUintToLEParams): string => {
    if (params.value.isNegative()) {
        throw new Error('Value cannot be negative');
    }

    if (!params.value.isInteger()) {
        throw new Error('Value must be an integer');
    }

    const paddingLength = params.bytesLength * 2;
    let hexString = params.value.toString(16);

    if (hexString.length > paddingLength) {
        throw new Error(`Exceeds ${params.bytesLength} bytes`);
    }

    hexString = hexString.padStart(paddingLength, '0');
    const bytes = new Uint8Array(params.bytesLength);

    for (let i = 0; i < params.bytesLength; i++) {
        bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
    }

    return Buffer.from(bytes.reverse()).toString('hex');
};
