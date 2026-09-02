import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const getAmountInBaseUnits = (amount: string, symbol: NetworkSymbol) =>
    unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        symbol,
    }).toString();
