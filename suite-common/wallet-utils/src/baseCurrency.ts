import { type NetworkSymbol, networks } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { AMOUNT_UNIT_ZERO, type AmountUnit, asAmountSubunit, asAmountUnit } from './AmountTypes';
import { subunitsToUnits, unitsToSubunits } from './amountUtils';
import { fromBaseCurrencyToCryptoUnit, toFiatCurrency } from './fiatConverterUtils';

export const BASE_CURRENCY_ZERO = asBaseCurrencyAmount(new BigNumber(0));

export const isBaseCurrencyWithSats = (baseCurrency: BaseCurrencyCode) => baseCurrency === 'btc';

type GetDecimalsForBaseCurrencyParams = {
    code: BaseCurrencyCode | '';
    isInSats: boolean;
};

export const getDecimalsForBaseCurrency = ({
    code,
    isInSats,
}: GetDecimalsForBaseCurrencyParams) => {
    if (code !== '' && isBaseCurrencyWithSats(code) && isInSats) {
        return 0;
    }

    return code in networks ? networks[code as NetworkSymbol].decimals : 2;
};

type AmountToFiatCurrencyWithSatsConversionParams = {
    cryptoAmount: AmountUnit;
    rate: number;
    baseCurrencyCode: BaseCurrencyCode;
    baseCurrencyToSats: boolean;
};

const amountToFiatCurrencyWithSatsConversion = ({
    cryptoAmount,
    rate,
    baseCurrencyCode,
    baseCurrencyToSats,
}: AmountToFiatCurrencyWithSatsConversionParams) => {
    // 2. toFiatCurrency always works with Unit Amount (BTC, not Satoshis)
    const baseCurrencyAmountUnit = toFiatCurrency({ amount: cryptoAmount, rate });

    if (baseCurrencyAmountUnit === null) {
        return null;
    }

    // 3. If BaseCurrency is BTC, and we display Sats, we need to convert it.
    const shouldConvertToSats = isBaseCurrencyWithSats(baseCurrencyCode) && baseCurrencyToSats;

    return shouldConvertToSats
        ? asBaseCurrencyAmount(
              unitsToSubunits({
                  value: asAmountUnit(baseCurrencyAmountUnit),
                  symbol: 'btc',
              }),
          )
        : baseCurrencyAmountUnit;
};

type ParseCryptoToFormattedBaseCurrencyParams = {
    areSatsDisplayed: boolean;
    baseCurrencyToSats: boolean; // This is related to `areSatsDisplayed` but should also cover the capability of network, etc...
    symbol: NetworkSymbol;
    value: BigNumber; // Intentionally no Branded Type. We don't know if it is in Units or Sub-Units.
    rate: number;
    baseCurrencyCode: BaseCurrencyCode;
};

export const parseCryptoToFormattedBaseCurrency = ({
    areSatsDisplayed,
    baseCurrencyToSats,
    symbol,
    value,
    rate,
    baseCurrencyCode,
}: ParseCryptoToFormattedBaseCurrencyParams) => {
    // 1. Get the correct Crypto Amount (in units, as I could have been entered in Sats)
    const cryptoAmount = baseCurrencyToSats
        ? subunitsToUnits({ value: asAmountSubunit(value), symbol })
        : asAmountUnit(value);

    const baseCurrencyDisplay = amountToFiatCurrencyWithSatsConversion({
        cryptoAmount,
        rate,
        baseCurrencyCode,
        baseCurrencyToSats: areSatsDisplayed,
    });

    // 4. We have to return this correctly rounded as this value is used in the NumberInput
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        isInSats: areSatsDisplayed,
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
    const finalValueDecimals = isCryptoInSats ? 0 : cryptoDecimals; // round units, not subunits

    return valueToDisplay?.toFixed(finalValueDecimals) ?? null;
};
