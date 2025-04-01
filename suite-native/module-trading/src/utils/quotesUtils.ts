import { CoinInfo } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import type { TradingBuyFormProps } from '@suite-common/trading';
import { toCryptoOption } from '@suite-common/trading';

import { TradingBuyForm } from '../types';
import { supportedFiatCurrenciesMap } from './supportedFiatCurrencies';

export const tradingBuyFormToTradingBuyFormProps = (
    form: TradingBuyForm,
    coinInfo: CoinInfo | undefined,
): TradingBuyFormProps => {
    const [asset, fiatCurrency, fiatValue, cryptoValue, amountInCrypto, country, paymentMethod] =
        form.getValues([
            'asset',
            'fiatCurrency',
            'fiatValue',
            'cryptoValue',
            'amountInCrypto',
            'country',
            'paymentMethod',
        ]);
    const currencyName = supportedFiatCurrenciesMap.get(fiatCurrency)?.label;

    invariant(currencyName, 'Currency is required');
    invariant(asset, 'Asset is required');
    invariant(coinInfo, 'CoinInfo is required');

    return {
        fiatInput: fiatValue,
        cryptoInput: cryptoValue,
        currencySelect: {
            value: fiatCurrency,
            label: currencyName,
        },
        cryptoSelect: toCryptoOption(asset.cryptoId, coinInfo),
        countrySelect: country,
        paymentMethod,
        amountInCrypto,
    };
};
