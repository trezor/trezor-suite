import { asNetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from './AmountTypes';
import { subunitsToUnits, unitsToSubunits } from './amountUtils';

const btcSymbol = asNetworkSymbol('btc');

describe(subunitsToUnits.name, () => {
    it('converts Sats->BTC', () => {
        expect(
            subunitsToUnits({
                value: asAmountSubunit(new BigNumber(1)),
                symbol: btcSymbol,
            }).toString(),
        ).toEqual('0.00000001');
    });
});

describe(unitsToSubunits.name, () => {
    it('converts BTC->Sats', () => {
        const btcSymbolResult = unitsToSubunits({
            value: asAmountUnit(new BigNumber(1)),
            symbol: btcSymbol,
        });
        expect(btcSymbolResult.toString()).toEqual(String(100_000_000));

        const decimalsResult = unitsToSubunits({
            value: asAmountUnit(new BigNumber(1)),
            decimals: 2,
        });
        expect(decimalsResult.toString()).toEqual('100');
    });
});
