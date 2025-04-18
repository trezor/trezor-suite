import { CoinInfo, CryptoId } from 'invity-api';

import { UnreachableCaseError, invariant } from '@suite-common/suite-utils';
import type {
    TradingBuyFormProps,
    TradingPaymentMethodListProps,
    TradingTransaction,
} from '@suite-common/trading';
import { toCryptoOption } from '@suite-common/trading';

import { TradingBuyForm } from '../types';
import { supportedFiatCurrenciesMap } from './supportedFiatCurrencies';

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

export const getTradeOperationData = (
    transaction: TradingTransaction,
): {
    fromValue: string | undefined;
    fromCryptoId: CryptoId | undefined;
    toValue: string | undefined;
    toCryptoId: CryptoId | undefined;
} => {
    const { tradeType } = transaction;
    switch (tradeType) {
        case 'buy': {
            const buy = transaction.data;

            return {
                fromValue: buy.fiatStringAmount,
                fromCryptoId: buy.fiatCurrency as CryptoId | undefined,
                toValue: buy.receiveStringAmount,
                toCryptoId: buy.receiveCurrency,
            };
        }
        case 'exchange': {
            const exchange = transaction.data;

            return {
                fromValue: exchange.sendStringAmount,
                fromCryptoId: exchange.send,
                toValue: exchange.receiveStringAmount,
                toCryptoId: exchange.receive,
            };
        }
        case 'sell': {
            const sell = transaction.data;

            return {
                fromValue: sell.cryptoStringAmount,
                fromCryptoId: sell.cryptoCurrency,
                toValue: sell.fiatStringAmount,
                toCryptoId: sell.fiatCurrency as CryptoId | undefined,
            };
        }

        default:
            throw new UnreachableCaseError(tradeType);
    }
};
