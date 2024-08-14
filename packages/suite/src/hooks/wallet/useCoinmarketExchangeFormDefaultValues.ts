import { useMemo } from 'react';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildCryptoOption, buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { ExchangeFormState } from 'src/types/wallet/coinmarketExchangeForm';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_EXCHANGE_CEX,
    FORM_RATE_FIXED,
} from 'src/constants/wallet/coinmarket/form';

export const useCoinmarketExchangeFormDefaultValues = (
    symbol: Account['symbol'],
    localCurrency: string,
    exchangeInfo?: ExchangeInfo,
    defaultAddress?: string,
) => {
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
                      sendCryptoSelect: buildCryptoOption(
                          networkToCryptoSymbol(symbol) ?? FORM_DEFAULT_CRYPTO_CURRENCY,
                      ),
                      options: ['broadcast'],
                      outputs: [
                          {
                              ...DEFAULT_PAYMENT,
                              address: defaultAddress,
                              currency: defaultCurrency,
                          },
                      ],
                      selectedUtxos: [],
                      rateType: FORM_RATE_FIXED,
                      exchangeType: FORM_EXCHANGE_CEX,
                      // TODO: remove type casting (options string[])
                  } as ExchangeFormState)
                : undefined,
        [exchangeInfo, symbol, defaultAddress, defaultCurrency],
    );

    return { defaultCurrency, defaultValues };
};
