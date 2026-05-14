import { useCallback, useMemo } from 'react';

import { type SellFiatTradeQuoteRequest } from 'invity-api';

import {
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingCountryCode,
    type TradingSellFormProps,
    buildTradingBaseCurrencyOptionFromFiat,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    selectTradingComposedTransactionInfo,
    useTradingAssets,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingSellFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: SellFiatTradeQuoteRequest | undefined,
): TradingSellFormProps | null => {
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const findAccount = useCallback(
        (assetOption: TradingAssetOption) =>
            accounts.find(account => {
                if (assetOption.isNativeToken) {
                    return account.symbol === assetOption.networkSymbol;
                }

                return (
                    account.symbol === assetOption.networkSymbol &&
                    assetOption.contractAddress &&
                    !!account.tokens?.find(
                        token =>
                            getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                            getContractAddressForNetworkSymbol(
                                assetOption.networkSymbol,
                                assetOption.contractAddress!,
                            ),
                    )
                );
            }),
        [accounts],
    );
    const findAccountRef = useCurrentRef(findAccount);
    const sendCrypto = useMemo(() => {
        const assetOption = createAssetOptionFromCryptoId(quotesRequest?.cryptoCurrency);
        const account = findAccountRef.current(assetOption);

        if (!account) return null;

        return {
            account,
            asset: {
                ...assetOption,
                accountKey: account.key,
            } satisfies TradingAssetSellOption,
        };
    }, [createAssetOptionFromCryptoId, findAccountRef, quotesRequest?.cryptoCurrency]);

    const { address, token } = resolveAddressAndToken(
        sendCrypto?.account,
        sendCrypto?.asset?.contractAddress,
    );

    return isFromRedirect && quotesRequest && sendCrypto
        ? {
              ...DEFAULT_VALUES,
              amountInCrypto: quotesRequest.amountInCrypto,
              sendCryptoSelect: sendCrypto?.asset,
              countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
              countrySubdivisionSelect: getDefaultCountrySubdivision(quotesRequest.subdivision),
              paymentMethod: quotesRequest.paymentMethod && {
                  value: quotesRequest.paymentMethod,
                  label: quotesRequest.paymentMethod,
              },
              feeLimit: composed?.feeLimit ?? '',
              feePerUnit: composed?.feePerByte ?? '',
              maxFeePerGas: composed?.maxFeePerGas ?? '',
              maxPriorityFeePerGas: composed?.maxPriorityFeePerGas ?? '',
              selectedFee,
              selectedUtxos: [],
              options: ['broadcast'],
              outputs: [
                  {
                      ...DEFAULT_PAYMENT,
                      fiat: quotesRequest.fiatStringAmount as string,
                      currency: buildTradingBaseCurrencyOptionFromFiat(quotesRequest.fiatCurrency),
                      amount: quotesRequest.cryptoStringAmount as string,
                      address,
                      token,
                  },
              ],
          }
        : null;
};
