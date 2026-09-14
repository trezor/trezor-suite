import { type NetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const getAmountInBaseUnits = (
    networkConfigDeps: NetworkConfigDeps,
    amount: string,
    symbol: NetworkSymbol,
) =>
    unitsToSubunits(networkConfigDeps, {
        value: asAmountUnit(new BigNumber(amount)),
        symbol,
    }).toString();
