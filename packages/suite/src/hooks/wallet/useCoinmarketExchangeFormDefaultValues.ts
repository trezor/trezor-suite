import { useMemo } from 'react';
import { ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';
import { ExchangeFormState } from '@wallet-types/coinmarketExchangeForm';

export const useCoinmarketExchangeFormDefaultValues = (
    symbol: Account['symbol'],
    localCurrency: string,
    exchangeInfo?: ExchangeInfo,
    defaultAddress?: string,
) => {
    const defaultCurrency = useMemo(() => buildOption(localCurrency), [localCurrency]);
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
                      sendCryptoSelect: buildOption(symbol),
                      options: ['broadcast'],
                      outputs: [
                          {
                              ...DEFAULT_PAYMENT,
                              address: defaultAddress,
                              currency: defaultCurrency,
                          },
                      ],
                      // TODO: remove type casting (options string[])
                  } as ExchangeFormState)
                : undefined,
        [exchangeInfo, symbol, defaultAddress, defaultCurrency],
    );
    return { defaultCurrency, defaultValues };
};
