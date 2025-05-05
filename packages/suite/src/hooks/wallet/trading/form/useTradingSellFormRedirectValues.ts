import { useMemo } from 'react';

import { SellFiatTradeQuoteRequest } from 'invity-api';

import {
    type TradingSellFormProps,
    getDefaultCountry,
    selectTradingComposedTransactionInfo,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';

import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import {
    buildFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
} from 'src/utils/wallet/trading/tradingUtils';

export const useTradingSellFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: SellFiatTradeQuoteRequest | undefined,
): TradingSellFormProps | null => {
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);

    const cryptoGroups = useTradingBuildAccountGroups('sell');
    const cryptoOptions = useMemo(
        () => cryptoGroups.flatMap(group => group.options),
        [cryptoGroups],
    );

    const sendCryptoSelect = useMemo(
        () =>
            quotesRequest?.cryptoCurrency
                ? cryptoOptions.find(option => option.value === quotesRequest.cryptoCurrency)
                : undefined,
        [cryptoOptions, quotesRequest?.cryptoCurrency],
    );

    const { address, token } = getAddressAndTokenFromAccountOptionsGroupProps(sendCryptoSelect);

    return isFromRedirect && quotesRequest && sendCryptoSelect
        ? {
              ...DEFAULT_VALUES,
              amountInCrypto: quotesRequest.amountInCrypto,
              sendCryptoSelect,
              countrySelect: getDefaultCountry(quotesRequest.country),
              paymentMethod: quotesRequest.paymentMethod && {
                  value: quotesRequest.paymentMethod,
                  label: quotesRequest.paymentMethod,
              },
              feeLimit: composed?.feeLimit ?? '',
              feePerUnit: composed?.feePerByte ?? '',
              selectedFee,
              selectedUtxos: [],
              options: ['broadcast'],
              outputs: [
                  {
                      ...DEFAULT_PAYMENT,
                      fiat: quotesRequest.fiatStringAmount as string,
                      currency: buildFiatOption(quotesRequest.fiatCurrency),
                      amount: quotesRequest.cryptoStringAmount as string,
                      address,
                      token,
                  },
              ],
          }
        : null;
};
