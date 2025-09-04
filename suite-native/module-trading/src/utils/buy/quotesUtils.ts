import { CoinInfo } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingBuyFormProps,
    TradingCountryOption,
    TradingPaymentMethodListProps,
    toCryptoOption,
} from '@suite-common/trading';

import { BuyFormType } from '../../types/buy';
import { getCurrencyLabel } from '../general/currencyUtils';

export const getPaymentMethodFromBuyForm = (
    form: BuyFormType,
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
    form: BuyFormType,
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
    const currencyName = getCurrencyLabel(fiatCurrency);

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
        countrySelect: country as TradingCountryOption,
        paymentMethod: getPaymentMethodFromBuyForm(form),
        amountInCrypto,
    };
};
