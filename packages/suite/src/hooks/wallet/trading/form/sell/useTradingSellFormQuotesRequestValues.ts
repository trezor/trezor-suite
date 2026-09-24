import { useSelector } from 'react-redux';

import { type SellFiatTrade, type SellFiatTradeQuoteRequest } from 'invity-api';

import {
    type TradingCountryCode,
    type TradingSellFormProps,
    buildTradingBaseCurrencyOptionFromFiat,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    selectTradingComposedTransactionInfo,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { type AccountKey } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingDefaultSellAsset } from '../common/useTradingDefaultSellAsset';

type UseTradingSellFormQuotesRequestValuesParams = {
    quotesRequest: SellFiatTradeQuoteRequest | undefined;
    selectedQuote: SellFiatTrade | undefined;
    accountKey: AccountKey | undefined;
    isFromRedirect: boolean;
    defaultValues: TradingSellFormProps;
};

export const useTradingSellFormQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    accountKey,
    isFromRedirect,
    defaultValues,
}: UseTradingSellFormQuotesRequestValuesParams): TradingSellFormProps | null => {
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);
    const { account, defaultAsset: sendCryptoSelect } = useTradingDefaultSellAsset({
        accountKey,
        cryptoId: quotesRequest?.cryptoCurrency,
    });
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    if (!quotesRequest || !account || sendCryptoSelect?.id !== quotesRequest.cryptoCurrency) {
        return null;
    }

    const { address, token } = resolveAddressAndToken(account, sendCryptoSelect.contractAddress);
    const { cryptoStringAmount } = quotesRequest;
    const amount =
        cryptoStringAmount && shouldSendInSats
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(cryptoStringAmount)),
                  symbol: account.symbol,
              }).toFixed()
            : cryptoStringAmount;
    const paymentMethod = selectedQuote?.paymentMethod ?? quotesRequest.paymentMethod;
    const [defaultOutput] = defaultValues.outputs;

    return {
        ...defaultValues,
        amountInCrypto: quotesRequest.amountInCrypto,
        sendCryptoSelect,
        countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
        countrySubdivisionSelect: getDefaultCountrySubdivision(quotesRequest.subdivision),
        paymentMethod: paymentMethod
            ? { value: paymentMethod, label: selectedQuote?.paymentMethodName ?? paymentMethod }
            : defaultValues.paymentMethod,
        provider: selectedQuote?.exchange,
        ...(isFromRedirect && {
            feeLimit: composed?.feeLimit ?? '',
            feePerUnit: composed?.feePerByte ?? '',
            maxFeePerGas: composed?.maxFeePerGas ?? '',
            maxPriorityFeePerGas: composed?.maxPriorityFeePerGas ?? '',
            selectedFee,
        }),
        outputs: [
            {
                ...DEFAULT_PAYMENT,
                ...defaultOutput,
                fiat: quotesRequest.fiatStringAmount ?? '',
                currency: buildTradingBaseCurrencyOptionFromFiat(quotesRequest.fiatCurrency),
                amount: amount ?? '',
                address,
                token,
            },
        ],
    };
};
