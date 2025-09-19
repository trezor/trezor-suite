import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils/src/bigNumber';

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
