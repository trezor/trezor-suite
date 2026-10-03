import { type BuyTradeQuoteRequest } from 'invity-api';

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

export const useTradingBuyFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: BuyTradeQuoteRequest | undefined,
): TradingBuyFormProps | null => {
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const cryptoSelect = quotesRequest
        ? createAssetOptionFromCryptoId(quotesRequest.receiveCurrency)
        : undefined;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(
        cryptoSelect?.networkSymbol,
    );

    if (!isFromRedirect || !quotesRequest || !cryptoSelect) {
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

    return {
        amountInCrypto: quotesRequest.wantCrypto,
        cryptoSelect,
        currencySelect: buildTradingFiatOption(
            getSupportedFiatCurrencyWithFallback(quotesRequest.fiatCurrency),
        ),
        countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
        countrySubdivisionSelect: getDefaultCountrySubdivision(quotesRequest.subdivision),

        // fill the input that corresponds to the entered amount type
        ...(quotesRequest.wantCrypto
            ? { cryptoInput }
            : { fiatInput: quotesRequest.fiatStringAmount }),

        paymentMethod: quotesRequest.paymentMethod && {
            value: quotesRequest.paymentMethod,
            label: quotesRequest.paymentMethod,
        },
    };
};
