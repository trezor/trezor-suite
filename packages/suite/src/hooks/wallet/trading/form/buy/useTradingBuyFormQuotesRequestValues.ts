import { type BuyTrade, type BuyTradeQuoteRequest } from 'invity-api';

import {
    type TradingBuyFormProps,
    type TradingCountryCode,
    buildTradingFiatOption,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getSupportedFiatCurrencyWithFallback,
    useTradingAssets,
} from '@suite-common/trading';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

type UseTradingBuyFormQuotesRequestValuesParams = {
    quotesRequest: BuyTradeQuoteRequest | undefined;
    selectedQuote: BuyTrade | undefined;
    defaultValues: TradingBuyFormProps;
};

export const useTradingBuyFormQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    defaultValues,
}: UseTradingBuyFormQuotesRequestValuesParams): TradingBuyFormProps | null => {
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const cryptoSelect = quotesRequest
        ? createAssetOptionFromCryptoId(quotesRequest.receiveCurrency)
        : undefined;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(
        cryptoSelect?.networkSymbol,
    );

    if (!quotesRequest || !cryptoSelect) {
        return null;
    }

    const { cryptoStringAmount } = quotesRequest;
    const cryptoInput =
        cryptoStringAmount && shouldSendInSats
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(cryptoStringAmount)),
                  symbol: cryptoSelect.networkSymbol,
              }).toFixed()
            : cryptoStringAmount;
    const paymentMethod = selectedQuote?.paymentMethod ?? quotesRequest.paymentMethod;

    return {
        ...defaultValues,
        amountInCrypto: quotesRequest.wantCrypto,
        cryptoSelect,
        currencySelect: buildTradingFiatOption(
            getSupportedFiatCurrencyWithFallback(quotesRequest.fiatCurrency),
        ),
        countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
        countrySubdivisionSelect: getDefaultCountrySubdivision(quotesRequest.subdivision),
        ...(quotesRequest.wantCrypto
            ? { cryptoInput }
            : { fiatInput: quotesRequest.fiatStringAmount }),
        paymentMethod: paymentMethod
            ? { value: paymentMethod, label: selectedQuote?.paymentMethodName ?? paymentMethod }
            : defaultValues.paymentMethod,
        provider: selectedQuote?.exchange,
    };
};
