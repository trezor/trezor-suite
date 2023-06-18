import { useMemo } from 'react';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { ExchangeFormState } from 'src/types/wallet/coinmarketExchangeForm';

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
                      selectedUtxos: [],
                      // TODO: remove type casting (options string[])
                  } as ExchangeFormState)
                : undefined,
        [exchangeInfo, symbol, defaultAddress, defaultCurrency],
    );
    return { defaultCurrency, defaultValues };
};
