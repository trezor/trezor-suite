import { CoinInfo } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import type { TradingBuyFormProps, TradingPaymentMethodListProps } from '@suite-common/trading';
import { toCryptoOption } from '@suite-common/trading';

import { supportedFiatCurrenciesMap } from '../../consts/general/supportedFiatCurrencies';
import { TradingBuyForm } from '../../types';

export const getPaymentMethodFromBuyForm = (
    form: TradingBuyForm,
): TradingPaymentMethodListProps | undefined => {
    const quote = form.getValues('quote');

    if (quote) {
        const { paymentMethodName: label, paymentMethod: value } = quote;
        if (label && value) {
            return { label, value };
        }
    }

    return undefined;
};

export const tradingBuyFormToTradingBuyFormProps = (
    form: TradingBuyForm,
    coinInfo: CoinInfo | undefined,
): TradingBuyFormProps => {
    const [asset, fiatCurrency, fiatValue, cryptoValue, amountInCrypto, country] = form.getValues([
        'asset',
        'fiatCurrency',
        'fiatValue',
        'cryptoValue',
        'amountInCrypto',
        'country',
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
        paymentMethod: getPaymentMethodFromBuyForm(form),
        amountInCrypto,
    };
};
