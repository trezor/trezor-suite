import type { GetNetworkConfigDep } from '@suite-common/networks';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
} from '@suite-common/wallet-config';
import type { TokenTransfer } from '@trezor/connect';
import { BigNumber, type BigNumberValue } from '@trezor/utils';

import { type AmountSubunit, type AmountUnit, asAmountSubunit, asAmountUnit } from './AmountTypes';

type FormattedNetworkDisplaySymbol = NetworkDisplaySymbol | `sat ${NetworkDisplaySymbol}`;

export const getAccountDecimals = (deps: GetNetworkConfigDep, symbol: NetworkSymbol) =>
    deps.getNetworkConfig(symbol).decimals;

type SubunitsToUnitsParams = { value: AmountSubunit } & SymbolOrDecimals;

/**
 * Converts Sats to Bitcoin (and similarly for other coins)
 */
export const subunitsToUnits = (params: SubunitsToUnitsParams): AmountUnit => {
    const decimals =
        'decimals' in params ? params.decimals : getAccountDecimals(params, params.symbol);

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return asAmountUnit(params.value.div(factor));
};

type SymbolOrDecimals = ({ symbol: NetworkSymbol } & GetNetworkConfigDep) | { decimals: number };

type UnitsToSubunitsParams = { value: AmountUnit } & SymbolOrDecimals;

/**
 * Converts Bitcoins to Sats (and similarly for other coins)
 */
export const unitsToSubunits = (params: UnitsToSubunitsParams): AmountSubunit => {
    const decimals =
        'decimals' in params ? params.decimals : getAccountDecimals(params, params.symbol);

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
export const networkAmountToSmallestUnit = (
    deps: GetNetworkConfigDep,
    amount: string | null,
    symbol: NetworkSymbol,
) => {
    if (!amount) return '0';

    const decimals = getAccountDecimals(deps, symbol);

    if (!decimals) return amount;

    return convertAmountUnitsToSubunits(amount, decimals);
};

/**
 * @deprecated use `subunitsToUnits` if you don't need formatting. If you need formating, use function that does ONLY formatting.
 */
export const formatNetworkAmount = (
    deps: GetNetworkConfigDep,
    amount: string,
    symbol: NetworkSymbol,
    withSymbol = false,
    isSatoshis?: boolean,
) => {
    const decimals = getAccountDecimals(deps, symbol);

    if (!decimals) return amount;

    let formattedAmount = convertAmountSubunitsToUnits(amount, decimals);

    if (withSymbol) {
        let formattedSymbol: FormattedNetworkDisplaySymbol =
            deps.getNetworkConfig(symbol).displaySymbol;

        if (isSatoshis) {
            formattedAmount = amount || '0';
            formattedSymbol = `sat ${deps.getNetworkConfig(symbol).displaySymbol}`;
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
