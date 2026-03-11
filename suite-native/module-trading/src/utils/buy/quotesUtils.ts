import type { BuyTrade, CoinInfo, PlatformsInfo } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingBuyFormProps,
    TradingCountryOption,
    TradingPaymentMethodListProps,
    createAssetOption,
    cryptoIdToNetwork,
    getCurrencyLabel,
} from '@suite-common/trading';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { BuyFormType } from '@suite-native/trading-types';

export type GetAnalyticsTradingBuyPayloadProps = {
    quote: BuyTrade | undefined;
    coinInfo: CoinInfo | undefined;
};

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
    platformInfo: PlatformsInfo | undefined,
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
        cryptoSelect: createAssetOption({ cryptoId: asset.cryptoId, coinInfo, platformInfo })!,
        countrySelect: country as TradingCountryOption,
        paymentMethod: getPaymentMethodFromBuyForm(form),
        amountInCrypto,
    };
};

export const getAnalyticsTradingBuyPayload = ({
    quote,
    coinInfo,
}: GetAnalyticsTradingBuyPayloadProps) => {
    if (!coinInfo || !quote?.receiveCurrency) {
        return null;
    }

    const tradeableAsset = coinInfoToTradeableAsset(quote.receiveCurrency, coinInfo);
    const symbol = cryptoIdToNetwork(quote.receiveCurrency)?.symbol;

    if (!tradeableAsset) {
        return null;
    }

    return {
        cryptoLabel: tradeableAsset.symbol,
        cryptoNetworkSymbol: symbol,
        cryptoContractAddress: tradeableAsset.contractAddress,
        paymentMethod: quote.paymentMethod,
        countryOfResidence: quote.country,
        exchangeName: quote.exchange,
    };
};
