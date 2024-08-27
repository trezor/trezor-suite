import { useMemo } from 'react';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { ExchangeFormState } from 'src/types/wallet/coinmarketExchangeForm';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { defaultCryptoCurrency } from 'src/constants/wallet/coinmarket/cryptoCurrencies';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CryptoId } from 'invity-api';

export const useCoinmarketExchangeFormDefaultValues = (
    symbol: Account['symbol'],
    localCurrency: string,
    exchangeInfo?: ExchangeInfo,
    defaultAddress?: string,
) => {
    const { buildDefaultCryptoOption } = useCoinmarketInfo();
    const cryptoId = getCoingeckoId(symbol) as CryptoId;

    const defaultCurrency = useMemo(() => buildFiatOption(localCurrency), [localCurrency]);
    const defaultValues = useMemo(
        () =>
            exchangeInfo
                ? ({
                      ...DEFAULT_VALUES,
                      feePerUnit: '',
                      feeLimit: '',
                      estimatedFeeLimit: undefined,
                      fiatInput: '',
                      cryptoInput: '',
                      receiveCryptoSelect: null,
                      sendCryptoSelect: buildDefaultCryptoOption(cryptoId),
                      options: ['broadcast'],
                      outputs: [
                          {
                              ...DEFAULT_PAYMENT,
                              address: defaultAddress,
                              currency: defaultCurrency,
                          },
                      ],
                      selectedUtxos: [],
                      // TODO: remove type casting (options string[])
                  } as ExchangeFormState)
                : undefined,
        [exchangeInfo, buildDefaultCryptoOption, cryptoId, defaultAddress, defaultCurrency],
    );

    return { defaultCurrency, defaultValues };
};
