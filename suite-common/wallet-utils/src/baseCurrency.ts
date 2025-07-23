import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { AMOUNT_UNIT_ZERO, asAmountSubunit, asAmountUnit } from './AmountTypes';
import { subunitsToUnits, unitsToSubunits } from './accountUtils';
import { fromBaseCurrencyToCryptoUnit, toFiatCurrency } from './fiatConverterUtils';

/**
 * Value in EUR, USD, ... but also it can be in BTC, currently the global BaseCurrency from the Settings is used.
 */
export type BaseCurrencyAmount = BigNumber & Branded<`base-currency-amount`>;
export const asBaseCurrencyAmount = (value: BigNumber) => value as BaseCurrencyAmount;

export const BASE_CURRENCY_ZERO = asBaseCurrencyAmount(new BigNumber(0));

export const isBaseCurrencyWithSats = (baseCurrency: BaseCurrencyCode) => baseCurrency === 'btc';

type GetDecimalsForBaseCurrencyParams = {
    code: BaseCurrencyCode | '';
    areSatsDisplayed: boolean;
};

export const getDecimalsForBaseCurrency = ({
    code,
    areSatsDisplayed,
}: GetDecimalsForBaseCurrencyParams) => {
    if (code === 'btc' && areSatsDisplayed) {
        return 0;
    }

    return code in networks ? networks[code as NetworkSymbol].decimals : 2;
};

type ParseCryptoToFormattedBaseCurrencyParams = {
    areSatsDisplayed: boolean;
    isCryptoInSats: boolean; // This is related to `areSatsDisplayed` but should also cover the capability of network, etc...
    symbol: NetworkSymbol;
    value: BigNumber; // Intentionally no Branded Type. We don't know if it is in Units or Sub-Units.
    rate: number;
    baseCurrencyCode: BaseCurrencyCode;
};

export const parseCryptoToFormattedBaseCurrency = ({
    areSatsDisplayed,
    isCryptoInSats,
    symbol,
    value,
    rate,
    baseCurrencyCode,
}: ParseCryptoToFormattedBaseCurrencyParams) => {
    // 1. Get the correct Crypto Amount (in units, as I could have been entered in Sats)
    const cryptoAmount = isCryptoInSats
        ? subunitsToUnits({ value: asAmountSubunit(value), symbol })
        : asAmountUnit(value);

    // 2. toFiatCurrency always works with Unit Amount (BTC, not Satoshis)
    const baseCurrencyAmountUnit = toFiatCurrency({ amount: cryptoAmount, rate });

    if (baseCurrencyAmountUnit === null) {
        return null;
    }

    // 3. If BaseCurrency is BTC, and we display Sats, we need to convert it.
    const isBaseCurrencyInSats = isBaseCurrencyWithSats(baseCurrencyCode) && areSatsDisplayed;
    const baseCurrencyDisplay = isBaseCurrencyInSats
        ? asBaseCurrencyAmount(
              unitsToSubunits({
                  value: asAmountUnit(baseCurrencyAmountUnit),
                  symbol: 'btc',
              }),
          )
        : baseCurrencyAmountUnit;

    // 4. We have to return this correctly rounded as this value is used in the NumberInput
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        areSatsDisplayed,
        code: baseCurrencyCode,
    });

    return baseCurrencyDisplay?.toFixed(baseCurrencyDecimals) ?? null;
};

type ParseBaseCurrencyToFormattedCryptoParams = {
    areSatsDisplayed: boolean;
    isCryptoInSats: boolean; // This is related to `areSatsDisplayed` but should also cover the capability of network, etc...
    value: BigNumber; // Intentionally no Branded Type. We don't know if it is in Units or Sub-Units.
    rate: number;
    cryptoDecimals: number;
};

export const parseBaseCurrencyToFormattedCrypto = ({
    areSatsDisplayed,
    isCryptoInSats,
    value,
    rate,
    cryptoDecimals,
}: ParseBaseCurrencyToFormattedCryptoParams) => {
    // 1. When BTC is used as BaseCurrency, and we display all in Sats, we have to perform
    // the conversion from sats->btc
    const baseCurrencyUnitAmount = asBaseCurrencyAmount(
        areSatsDisplayed
            ? subunitsToUnits({
                  value: asAmountSubunit(value),
                  symbol: 'btc',
              })
            : value,
    );

    // 2. `fromFiatCurrency` requires Amount in Unit (BTC, not Sats)
    const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: baseCurrencyUnitAmount, rate });

    // 3. If we display Crypto in Sats, we have to convert it to it.
    const valueToDisplay = isCryptoInSats
        ? unitsToSubunits({
              value: cryptoAmount ?? AMOUNT_UNIT_ZERO,
              decimals: cryptoDecimals,
          })
        : cryptoAmount;

    // 4. We have to return this correctly rounded as this value is used in the NumberInput
    return valueToDisplay?.toFixed(cryptoDecimals) ?? null;
};
