import { useMemo } from 'react';
import regional from '@wallet-constants/coinmarket/regional';
import { SellInfo } from '@wallet-actions/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';
import { SellFormState } from '@wallet-types/coinmarketSellForm';

export const useCoinmarketSellFormDefaultValues = (
    symbol: Account['symbol'],
    sellInfo?: SellInfo,
    defaultAddress?: string,
) => {
    const country = sellInfo?.sellList?.country || regional.unknownCountry;
    const defaultCountry = useMemo(
        () => ({
            label: regional.countriesMap.get(country),
            value: country,
        }),
        [country],
    );
    const defaultCurrency = useMemo(() => ({ label: 'EUR', value: 'eur' }), []);
    const defaultValues = useMemo(
        () =>
            sellInfo
                ? ({
                      ...DEFAULT_VALUES,
                      feePerUnit: '',
                      feeLimit: '',
                      estimatedFeeLimit: undefined,
                      fiatInput: '',
                      fiatCurrencySelect: defaultCurrency,
                      cryptoInput: '',
                      cryptoCurrencySelect: buildOption(symbol),
                      countrySelect: defaultCountry,
                      options: ['broadcast'],
                      outputs: [
                          {
                              ...DEFAULT_PAYMENT,
                              address: defaultAddress,
                          },
                      ],
                      // TODO: remove type casting (options string[])
                  } as SellFormState)
                : undefined,
        [symbol, defaultCountry, defaultCurrency, sellInfo, defaultAddress],
    );
    return { defaultCountry, defaultCurrency, defaultValues };
};
